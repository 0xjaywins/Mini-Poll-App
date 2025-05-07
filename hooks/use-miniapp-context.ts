import { useFrame } from "../components/farcaster-provider";
import { FrameContext } from "@farcaster/frame-core/dist/context";
import sdk from "@farcaster/frame-sdk";

interface WarpcastUser {
  fid?: number;
  pfp?: string;
  username?: string;
  displayName?: string;
}

interface UserContext {
  fid?: number;
  pfpUrl?: string;
  username?: string;
  displayName?: string;
}

interface FarcasterContextResult {
  context: FrameContext;
  actions: typeof sdk.actions | null;
  isEthProviderAvailable: boolean;
  user: WarpcastUser;
}

interface NoContextResult {
  type: null;
  context: null;
  actions: null;
  isEthProviderAvailable: boolean;
  user: null;
}

type ContextResult = FarcasterContextResult | NoContextResult;

export const useMiniAppContext = (): ContextResult => {
  try {
    const farcasterContext = useFrame();
    if (farcasterContext.context) {
      console.log("Farcaster Context:", farcasterContext.context);
      const context = farcasterContext.context;
      const user: WarpcastUser = {
        fid: context?.user?.fid ?? undefined,
        pfp: context?.user?.pfpUrl ?? undefined,
        username: context?.user?.username ?? undefined,
        displayName: context?.user?.displayName ?? undefined,
      };
      return {
        context,
        actions: farcasterContext.actions,
        isEthProviderAvailable: farcasterContext.isEthProviderAvailable,
        user,
      } as FarcasterContextResult;
    }
  } catch (e) {
    console.error("Error accessing Farcaster context:", e);
  }
  return {
    type: null,
    context: null,
    actions: null,
    isEthProviderAvailable: typeof window !== "undefined" && !!window.ethereum,
    user: null,
  } as NoContextResult;
};