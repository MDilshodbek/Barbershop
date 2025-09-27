import { ObjectId } from 'bson';

export const shapeIntoMongoObjectId = (target: any) => {
	return typeof target === 'string' ? new ObjectId(target) : target;
};

export const availableBarberSorts = ['gender', 'level', 'memberLike', 'memberRank'];
export const availableMemberSorts = ['createdAt', 'gender', 'level', 'memberLike', 'memberRank'];

// IMAGE CONFIGURATION
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

export const validMimeTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp'];
export const getSerialForImage = (filename: string) => {
	const ext = path.parse(filename).ext;
	return uuidv4() + ext;
};
