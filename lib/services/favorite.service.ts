import { AppError } from "./errors";
import { deleteUserCache, getCache, setCache } from "@/lib/cache";
import {
  favoriteRepository,
  type FavoriteRepository,
  type FavoriteMeal,
} from "@/lib/repositories/favorite.repository";
import { userRepository, type UserRepository } from "@/lib/repositories/user.repository";
import { checkAndComsumeAiQuota } from "./ai-quota";
import { analyzeFood } from "./ai";

export class FavoriteService {
  constructor(
    private readonly repository: FavoriteRepository = favoriteRepository,
    private readonly userRepo: UserRepository = userRepository,
  ) { }

  async getUserFavorites(userId: number): Promise<FavoriteMeal[]> {
    const user = await this.userRepo.findUserById(userId);
    if (!user) {
      throw new AppError(404, "User not found");
    }

    if (user.subscription?.plan !== "PRO") {
      throw new AppError(403, "PRO subscription required");
    }

    const cacheKey = `cache:user:${user.id}:meals:favorites`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return cached as FavoriteMeal[];
    }

    const favorites = await this.repository.findByUserId(user.id);
    await setCache(cacheKey, favorites, 60 * 60); // 1 hour

    return favorites;
  }

  /**
     * แก้ไขรายการโปรด:
     * ตรวจสิทธิ์ PRO → หักโควต้า AI → ตรวจความเป็นเจ้าของ Favorite →
     * ให้ AI คำนวณแคลอรี/โปรตีนใหม่ตาม amount/unit → บันทึกผ่าน favRepository → ล้าง cache
     */
  async updateFavoriteMeal(
    userId: number,
    input: {
      favoriteId: number;
      amount: number;
      unit: string;
    },
  ) {
    if (input.amount <= 0 || !input.unit.trim()) {
      throw new AppError(400, "Invalid amount or unit");
    }

    // 1) ตรวจสอบผู้ใช้และสิทธิ์ PRO
    const user = await this.userRepo.findUserById(userId);
    if (!user) {
      throw new AppError(404, "User not found");
    }

    if (user.subscription?.plan !== "PRO") {
      throw new AppError(403, "Pro subscription required");
    }

    // 2) หักและตรวจโควต้า AI
    const quotaExceeded = await checkAndComsumeAiQuota(
      userId,
      user.subscription?.plan,
    );
    if (quotaExceeded) {
      const body = (await quotaExceeded.json()) as { message?: string };
      throw new AppError(
        quotaExceeded.status,
        body.message ?? "AI limit reached",
      );
    }

    // 3) หา FavoriteMeal และตรวจความเป็นเจ้าของ
    const favorite = await this.repository.findById(input.favoriteId);
    if (!favorite) {
      throw new AppError(404, "Favorite meal not found");
    }

    if (favorite.userId !== user.id) {
      throw new AppError(403, "Forbidden: You do not own this favorite meal");
    }

    // 4) ให้ AI คำนวณคุณค่าทางโภชนาการใหม่
    const query = `${favorite.name} ${input.amount} ${input.unit}`;
    const aiAnalysis = await analyzeFood(query);

    const calories = aiAnalysis.estimatedCalories ?? 0;
    const protein = aiAnalysis.estimatedProtein ?? 0;

    // 5) อัปเดตผ่าน repository
    const updated = await this.repository.update(favorite.id, {
      amount: input.amount,
      unit: input.unit.trim(),
      calories,
      protein,
    });

    // 6) ล้าง cache ของผู้ใช้
    await deleteUserCache(userId);

    return updated;
  }

  /**
     * ลบรายการโปรด:
     * ตรวจสิทธิ์ PRO → ตรวจความเป็นเจ้าของ Favorite → ลบผ่าน favRepository → ล้าง cache
     */
  async deleteFavoriteMeal(userId: number, favoriteId: number) {
    const user = await this.userRepo.findUserById(userId);
    if (!user) {
      throw new AppError(404, "User not found");
    }

    if (user.subscription?.plan !== "PRO") {
      throw new AppError(403, "Pro subscription required");
    }

    const favorite = await this.repository.findById(favoriteId);
    if (!favorite) {
      throw new AppError(404, "Favorite meal not found");
    }

    if (favorite.userId !== user.id) {
      throw new AppError(403, "Forbidden: You do not own this favorite meal");
    }

    const deleted = await this.repository.delete(favorite.id);

    await deleteUserCache(userId);

    return deleted;
  }
}

export const favoriteService = new FavoriteService();

