import axios from "axios";
import { baseUrl } from "../const/BaseUrl";

export interface FavouriteDto {
  pageid: number;
  pagename: string;
  route: string;
}

export const favouritesCacheKey = (userId: string) => `UserFavourites_${userId}`;

export const readFavouritesCache = (userId: string): FavouriteDto[] | null => {
  try {
    const raw = sessionStorage.getItem(favouritesCacheKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FavouriteDto[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const writeFavouritesCache = (userId: string, favourites: FavouriteDto[]) => {
  try {
    sessionStorage.setItem(favouritesCacheKey(userId), JSON.stringify(favourites));
  } catch {
    // ignore cache write failures
  }
};

export const getFavourites = (userId: string) =>
  axios.get<FavouriteDto[]>(`${baseUrl}/UserFavourites/${userId}`);

export const addFavourite = (userId: string, pageId: number) =>
  axios.post(`${baseUrl}/AddFavourites`, { userId, pageId });

export const removeFavourite = (userId: string, pageId: number) =>
  axios.delete(`${baseUrl}/RemoveFavourites/${userId}/${pageId}`);
