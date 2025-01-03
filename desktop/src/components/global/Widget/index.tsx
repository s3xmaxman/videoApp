import { ClerkLoading, SignedIn, useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { fetchUserProfile } from "@/lib/utils";
import MediaConfiguration from "../MediaConfiguration";
import { useMediaSources } from "@/hooks/useMediaResources";
import { Loader } from "../Loader";

type Subscription = {
  plan: "PRO" | "FREE";
};

type Studio = {
  id: string;
  screen: string | null;
  mic: string | null;
  preset: "HD" | "SD";
  userId: string | null;
};

type User = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: Date;
  clerkid: string;
  subscription: Subscription | null;
  studio: Studio | null;
};

type Profile = {
  status: number;
  user: User | null;
};

const Widget = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const { user } = useUser();
  const { state, fetchMediaResources } = useMediaSources();

  useEffect(() => {
    if (user && user.id) {
      fetchUserProfile(user.id).then((profile) => {
        setProfile(profile);
      });
      fetchMediaResources();
    }
  }, [user]);

  return (
    <div className="p-5">
      <ClerkLoading>
        <div className="h-full flex justify-center items-center">
          <Loader />
        </div>
      </ClerkLoading>
      <SignedIn>
        {profile ? (
          <MediaConfiguration state={state} user={profile.user} />
        ) : (
          <div className="w-full h-full flex justify-center items-center">
            <Loader className="text-white" />
          </div>
        )}
      </SignedIn>
    </div>
  );
};

export default Widget;
