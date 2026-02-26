import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { baseUrl } from '../const/BaseUrl';
import { addFavourite as apiAdd, removeFavourite as apiRemove } from '../components/Favourites';
import { readFavouritesCache, writeFavouritesCache } from './Favourites';
import type { FavouriteDto } from './Favourites';

interface FavouritesContextType {
  favourites: number[];
  favouriteLinks: FavouriteDto[];
  addFavourite: (pageId: number, title: string, route: string) => Promise<void>;
  removeFavourite: (pageId: number) => Promise<void>;
  isFavourite: (pageId: number) => boolean;
  loading: boolean;
}

const FavouritesContext = createContext<FavouritesContextType | undefined>(undefined);

export const FavouritesProvider: React.FC<{ children: React.ReactNode; sessionUserID: string }> = ({ children, sessionUserID }) => {
  const [favourites, setFavourites] = useState<number[]>([]);
  const [favouriteLinks, setFavouriteLinks] = useState<FavouriteDto[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavourites = useCallback(async () => {
    if (!sessionUserID) {
      setFavourites([]);
      setFavouriteLinks([]);
      setLoading(false);
      return;
    }
    const cachedFavourites = readFavouritesCache(sessionUserID);
    if (cachedFavourites) {
      setFavouriteLinks(cachedFavourites);
      setFavourites(cachedFavourites.map(f => f.pageid));
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await axios.get<FavouriteDto[]>(`${baseUrl}/UserFavourites/${sessionUserID}`);
      const favs = res.data || [];
      setFavouriteLinks(favs);
      setFavourites(favs.map(f => f.pageid));
      writeFavouritesCache(sessionUserID, favs);
    } catch (err) {
      console.error("Failed to fetch favourites", err);
    } finally {
      setLoading(false);
    }
  }, [sessionUserID]);

  useEffect(() => {
    fetchFavourites();
  }, [fetchFavourites]);

  const addFavourite = useCallback(async (pageId: number, title: string, route: string) => {
    if (!sessionUserID || favourites.includes(pageId)) return;
    try {
      await apiAdd(sessionUserID, pageId);
      setFavourites(prev => [...prev, pageId]);
      setFavouriteLinks(prev => {
        const updated = [...prev, { pageid: pageId, pagename: title, route }];
        writeFavouritesCache(sessionUserID, updated);
        return updated;
      });
    } catch (err) {
      console.error("Failed to add favourite", err);
    }
  }, [sessionUserID, favourites]);

  const removeFavourite = useCallback(async (pageId: number) => {
    if (!sessionUserID) return;
    try {
      await apiRemove(sessionUserID, pageId);
      setFavourites(prev => prev.filter(id => id !== pageId));
      setFavouriteLinks(prev => {
        const updated = prev.filter(link => link.pageid !== pageId);
        writeFavouritesCache(sessionUserID, updated);
        return updated;
      });
    } catch (err) {
      console.error("Failed to remove favourite", err);
    }
  }, [sessionUserID]);

  const isFavourite = useCallback((pageId: number) => favourites.includes(pageId), [favourites]);

  return (
    <FavouritesContext.Provider value={{ favourites, favouriteLinks, addFavourite, removeFavourite, isFavourite, loading }}>
      {children}
    </FavouritesContext.Provider>
  );
};

export const useFavourites = () => {
  const context = useContext(FavouritesContext);
  if (!context) throw new Error("useFavourites must be used within a FavouritesProvider");
  return context;
};
