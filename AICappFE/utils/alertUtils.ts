let isSessionExpiredAlertShowing = false;

export const showSessionExpiredAlert = (onOk: () => void) => {
  if (isSessionExpiredAlertShowing) {
    console.log("🚫 Session expired alert already showing, skipping");
    return;
  }

  isSessionExpiredAlertShowing = true;

  import("react-native").then(({ Alert }) => {
    Alert.alert(
      "Session Expired",
      "Your session has expired. Please log in again.",
      [
        {
          text: "OK",
          onPress: () => {
            isSessionExpiredAlertShowing = false;
            onOk();
          },
        },
      ],
      {
        cancelable: false,
        onDismiss: () => {
          isSessionExpiredAlertShowing = false;
        },
      }
    );
  });
};

export const resetSessionExpiredAlert = () => {
  isSessionExpiredAlertShowing = false;
};
