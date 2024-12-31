import { SourceDeviceStateProps } from "@/hooks/use-media-sources";

type Props = {
  state: SourceDeviceStateProps;
  user:
    | ({
        subscription: {
          plan: "PRO" | "FREE";
        } | null;
        studio: {
          id: string;
          screen: string | null;
          mic: string | null;
          preset: "HD" | "SD";
          camera: string | null;
          userId: string | null;
        } | null;
      } & {
        id: string;
        email: string;
        firstname: string;
        lastname: string;
        createdAt: Date;
        clerkid: string;
      })
    | null;
};

const MediaConfiguration = ({ state, user }: Props) => {
  const {} = useStudioSettings();

  return <form className="flex flex-col h-full w-full relative gap-y-5"></form>;
};

export default MediaConfiguration;
