import { useFrame } from "../components/farcaster-provider";
import { FrameContext } from "@farcaster/frame-core/dist/context";
import sdk from "@farcaster/frame-sdk";

// Define user type based on Farcaster context
interface WarpcastUser {
  fid?: number;
  pfp?: string; // Maps to pfpUrl
  username?: string;
  displayName?: string;
}

// Define the expected structure of UserContext (inferred from usage)
interface UserContext {
  fid?: number; // Made optional to match runtime behavior
  pfpUrl?: string;
  username?: string;
  displayName?: string;
}

// Define specific types for each context
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

// Union type of all possible results
type ContextResult = FarcasterContextResult | NoContextResult;

export const useMiniAppContext = (): ContextResult => {
  // Try to get Farcaster context
  try {
    const farcasterContext = useFrame();
    if (farcasterContext.context) {
      // Log the context to confirm its structure
      console.log("Farcaster Context:", farcasterContext.context);

      const context = farcasterContext.context;
      const user: WarpcastUser = {
        fid: context?.user?.fid ?? undefined,
        pfp: context?.user?.pfpUrl ?? undefined, // Map pfpUrl to pfp
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

  // No context found
  return {
    type: null,
    context: null,
    actions: null,
    isEthProviderAvailable: typeof window !== "undefined" && !!window.ethereum,
    user: null,
  } as NoContextResult;
};