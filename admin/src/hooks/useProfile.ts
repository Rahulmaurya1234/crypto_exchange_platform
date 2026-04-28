// src/react-app/hooks/useProfile.ts
import { useState, useEffect } from "react";
import type { UserProfile } from "../shared/types";
import api from "../utils/api";

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/auth/profile");
      setProfile(
        response.data?.data?.profile || response.data?.profile || null
      );
      setError(null);
    } catch (err: any) {
      setError("Failed to fetch profile");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const createProfile = async (profileData: any) => {
    try {
      const response = await api.post("/auth/profile", profileData);
      const newProfile =
        response.data?.data?.profile || response.data?.profile;
      setProfile(newProfile);
      return newProfile;
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message || "Failed to create profile";
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const updateProfile = async (profileData: any) => {
    try {
      const response = await api.patch("/auth/profile", profileData);
      const updatedProfile =
        response.data?.data?.profile || response.data?.profile;
      setProfile(updatedProfile);
      return updatedProfile;
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message || "Failed to update profile";
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  return {
    profile,
    isLoading,
    error,
    fetchProfile,
    createProfile,
    updateProfile,
  };
}
