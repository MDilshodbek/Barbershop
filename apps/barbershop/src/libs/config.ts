import { ObjectId } from 'bson';

export const shapeIntoMongoObjectId = (target: any) => {
	return typeof target === 'string' ? new ObjectId(target) : target;
};

export const availableBarberSorts = ['gender', 'level', 'memberLike', 'memberRank'];
export const availableMemberSorts = ['createdAt', 'gender', 'level', 'memberLike', 'memberRank'];
export const availableReserveSorts = ['createdAt', 'oldest'];
export const availableScheduleSorts = ['daily', 'weekly'];
export const availableBoardArticleSorts = ['createdAt', 'updatedAt', 'articleLikes', 'articleViews'];
export const availableCommentSorts = ['createdAt', 'updatedAt'];

// IMAGE CONFIGURATION
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

export const validMimeTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp'];
export const getSerialForImage = (filename: string) => {
	const ext = path.parse(filename).ext;
	return uuidv4() + ext;
};

// ADDED: tiny Seoul-time helpers (no external libs)
export const ymdInSeoul = (d: Date): string =>
	new Date(d.toLocaleString('en-CA', { timeZone: 'Asia/Seoul', hour12: false })).toISOString().slice(0, 10);

export const seoulDayWindowUTC = (ymd: string, startHour = 9, endHour = 20) => {
	const s = new Date(`${ymd}T${String(startHour).padStart(2, '0')}:00:00+09:00`);
	const e = new Date(`${ymd}T${String(endHour).padStart(2, '0')}:00:00+09:00`);
	return { startUtc: new Date(s.toISOString()), endUtc: new Date(e.toISOString()) };
};

export const seoulHourMinute = (d: Date) => {
	const parts = new Intl.DateTimeFormat('en-GB', {
		hour: '2-digit',
		minute: '2-digit',
		hour12: false,
		timeZone: 'Asia/Seoul',
	}).formatToParts(d);
	const h = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
	const m = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
	return { h, m };
};

export const kstDayWindow = (ymd: string, startHour = 9, endHour = 20) => {
	const pad = (n: number) => String(n).padStart(2, '0');
	const start = new Date(`${ymd}T${pad(startHour)}:00:00+09:00`);
	const end = new Date(`${ymd}T${pad(endHour)}:00:00+09:00`);
	return { start, end };
};

// ADDED: YYYY-MM-DD ga xavfsiz formatlovchi (Asia/Seoul)
export const toKstYMD = (d: Date) =>
	new Intl.DateTimeFormat('en-CA', {
		timeZone: 'Asia/Seoul',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).format(d);

export const kstInstant = (ymd: string, hhmm: string): Date => new Date(`${ymd}T${hhmm}:00+09:00`);
