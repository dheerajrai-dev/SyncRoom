import { z } from 'zod';

export const createRoomSchema = z.object({
  roomName: z
    .string()
    .min(1, 'Room name is required')
    .max(50, 'Room name must not exceed 50 characters'),
});

export type CreateRoomFormData = z.infer<typeof createRoomSchema>;

export const joinRoomSchema = z.object({
  roomCode: z
    .string()
    .min(4, 'Room code must be at least 4 characters')
    .max(8, 'Room code must not exceed 8 characters')
    .transform((val) => val.trim().toUpperCase()),
  nickname: z
    .string()
    .min(1, 'Nickname is required')
    .max(30, 'Nickname must not exceed 30 characters')
    .transform((val) => val.trim()),
});

export type JoinRoomFormData = z.infer<typeof joinRoomSchema>;

export const renameRoomSchema = z.object({
  roomName: z
    .string()
    .min(1, 'Room name cannot be empty')
    .max(50, 'Room name must not exceed 50 characters'),
});

export type RenameRoomFormData = z.infer<typeof renameRoomSchema>;
