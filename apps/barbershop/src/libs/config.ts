import { ObjectId } from 'bson';

export const shapeIntoMongoObjectId = (target: any) => {
	return typeof target === 'string' ? new ObjectId(target) : target;
};

export const availableBarberSorts = ["gender", "level", "memberLike", "memberRank"]
export const availableMemberSorts = ["createdAt", "gender", "level", "memberLike", "memberRank"]
