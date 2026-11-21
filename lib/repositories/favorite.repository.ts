import prisma from "@/lib/db/prisma";
import type { FavoriteMealModel } from "@/app/generated/prisma/models";

export type FavoriteMeal = FavoriteMealModel;

export type UpdateFavoriteMealInput = {
  amount?: number;
  unit?: string;
  calories?: number;
  protein?: number;
};

export class FavoriteRepository {
  async findByUserId(userId: number): Promise<FavoriteMeal[]> {
    return prisma.favoriteMeal.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: number): Promise<FavoriteMeal | null> {
    return prisma.favoriteMeal.findUnique({
      where: { id },
    });
  }

  async update(id: number, data: UpdateFavoriteMealInput): Promise<FavoriteMeal> {
    return prisma.favoriteMeal.update({
      where: { id },
      data,
    });
  }

  async delete(id: number): Promise<FavoriteMeal> {
    return prisma.favoriteMeal.delete({
      where: { id },
    });
  }
}

export const favoriteRepository = new FavoriteRepository();

