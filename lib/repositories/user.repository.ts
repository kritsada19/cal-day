import prisma from "../db/prisma";

export class UserRepository {

    /**
   * ค้นหาผู้ใช้ด้วย userId และดึงข้อมูล subscription
   */
    async findUserById(userId: number) {
        return prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                subscription: {
                    select: { plan: true },
                },
            },
        });
    }
}

export const userRepository = new UserRepository();