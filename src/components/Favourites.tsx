import axios from "axios";
import { baseUrl } from "../const/BaseUrl";

export interface FavouriteDto {
  pageid: number;
  pagename: string;
  route: string;
}

export const getFavourites = (userId: string) =>
  axios.get<FavouriteDto[]>(`${baseUrl}/UserFavourites/${userId}`);

export const addFavourite = (userId: string, pageId: number) =>
  axios.post(`${baseUrl}/AddFavourites`, { userId, pageId });

export const removeFavourite = (userId: string, pageId: number) =>
  axios.delete(`${baseUrl}/RemoveFavourites/${userId}/${pageId}`);
