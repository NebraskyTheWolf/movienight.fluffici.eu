import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import {CHAT_PERMISSION} from "@/lib/constants.ts";
import {IProfile, Sanction} from "@/models/Profile.ts";
import {User} from "next-auth";

export type Bitfield = number;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const hasAdministratorPermission = (permissions: Bitfield): boolean => {
  return (permissions & CHAT_PERMISSION.ADMINISTRATOR) === CHAT_PERMISSION.ADMINISTRATOR;
};

export const getAvatarsIconUrl = (user?: User): string => {
  if (user?.image) {
    return user.image;
  }
  return 'https://cdn.discordapp.com/embed/avatars/0.png';
};

export const hasPermission = (user: {
  discordId: string;
  permissions: Bitfield;
  flags: Bitfield;
  sanction: Sanction
} | undefined, permission: number = 0): boolean => {
  if (user)
    return (user.permissions & permission) === permission;
  else return false;
};
