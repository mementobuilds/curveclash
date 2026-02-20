import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "./ui/alert-dialog";

interface GamePassDialogsProps {
  showPassErrorDialog: boolean;
  showPassExpiredDialog: boolean;
  showWelcomeDialog: boolean;
  passError: string | null;
  isRedeeming: boolean;
  onPlayAsGuest: () => void;
  onGetNewPass: () => void;
  onDismissPassError: () => void;
  onDismissPassExpired: () => void;
  onDismissWelcomeDialog: () => void;
}

export function GamePassDialogs({
  showPassErrorDialog,
  showPassExpiredDialog,
  showWelcomeDialog,
  passError,
  isRedeeming,
  onPlayAsGuest,
  onGetNewPass,
  onDismissPassError,
  onDismissPassExpired,
  onDismissWelcomeDialog,
}: GamePassDialogsProps) {
  return (
    <>
      <AlertDialog open={showPassErrorDialog}>
        <AlertDialogContent className="bg-gray-900 border-gray-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Game Pass Invalid</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              {passError || "Your game pass could not be validated. You can play as a guest or get a new pass."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                onDismissPassError();
                onPlayAsGuest();
              }}
              className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
            >
              Play as Guest
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDismissPassError();
                onGetNewPass();
              }}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Get New Pass
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showPassExpiredDialog}>
        <AlertDialogContent className="bg-gray-900 border-gray-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Game Pass Expired</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Your game pass has expired. Purchase a new pass to continue playing with your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={onDismissPassExpired}
              className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
            >
              Close
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDismissPassExpired();
                onGetNewPass();
              }}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Get New Pass
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showWelcomeDialog}>
        <AlertDialogContent className="bg-gray-900 border-gray-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Welcome to Curve Clash</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Get a Game Pass from Orange to play with your account and track your scores, or play as a guest for free.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                onDismissWelcomeDialog();
                onPlayAsGuest();
              }}
              className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
            >
              Play as Guest
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDismissWelcomeDialog();
                onGetNewPass();
              }}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Get Game Pass
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
