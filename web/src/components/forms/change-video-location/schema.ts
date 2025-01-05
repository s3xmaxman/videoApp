import { z } from "zod";

export const moveVideoSchema = z.object({
  folder_id: z.string(),
  workspace_id: z.string(),
});
