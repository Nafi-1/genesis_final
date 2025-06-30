import { channelDeploymentHandler } from "../../supabase/functions/channel-deployment";
// If the file is actually in 'src' at the same level as 'functions', use '../src/channel-deployment'
// Otherwise, create the file at the expected path or update the import path accordingly.

export default async function handler(request: Request) {
  return channelDeploymentHandler(request);
}