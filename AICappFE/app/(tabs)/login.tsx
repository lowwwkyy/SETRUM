import * as AuthSession from "expo-auth-session";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../hooks/useAuth";
import { AuthService, User } from "../../services/AuthService";
WebBrowser.maybeCompleteAuthSession();

const discovery = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://www.googleapis.com/oauth2/v4/token",
  revocationEndpoint: "https://oauth2.googleapis.com/revoke",
};

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { user, isLoggedIn, logout, refreshAuthStatus } = useAuth();

  // Untuk Expo development, selalu gunakan Web Client ID
  // Platform.select tidak akurat untuk Expo managed workflow
  const clientId =
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
    "823414483818-s19nphuvt9gn656nu1i3r4nteeh94ebm.apps.googleusercontent.com";

  // Generate redirect URI untuk development - paksa gunakan localhost
  const redirectUri = __DEV__
    ? "http://localhost:19006" // Force localhost untuk development
    : AuthSession.makeRedirectUri({ scheme: "aic" }); // Production scheme

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: clientId!,
      scopes: ["openid", "profile", "email"],
      redirectUri: redirectUri,
    },
    discovery
  );

  useEffect(() => {
    if (response?.type === "success") {
      const { authentication } = response;
      if (authentication?.accessToken) {
        handleGoogleLoginSuccess(authentication.accessToken);
      }
    } else if (response?.type === "error") {
      console.error("OAuth Error:", response.error);
      console.error("OAuth Error Details:", response.params);
      Alert.alert(
        "Login Error",
        `Error: ${response.error}\nDetails: ${JSON.stringify(response.params)}`
      );
    } else if (response?.type === "cancel") {
      console.log("OAuth Cancelled by user");
    }
  }, [response]);

  const handleGoogleLoginSuccess = async (accessToken: string) => {
    setIsGoogleLoading(true);
    try {
      // Dapatkan informasi user dari Google
      const userInfoResponse = await fetch(
        `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`
      );
      const userInfo = await userInfoResponse.json();

      console.log("Google User Info:", userInfo);

      // Buat user object
      const user: User = {
        id: userInfo.id,
        name: userInfo.name,
        email: userInfo.email,
        picture: userInfo.picture,
        provider: "google",
      };

      // Simpan user dan token
      await AuthService.saveUser(user);
      await AuthService.saveToken(accessToken);

      // Refresh auth status
      refreshAuthStatus();

      // Optional: Kirim ke backend untuk validasi/registrasi
      // try {
      //   const backendResponse = await ApiService.loginWithGoogle(accessToken, userInfo);
      //   await AuthService.saveToken(backendResponse.token);
      // } catch (error) {
      //   console.error('Backend validation error:', error);
      // }

      Alert.alert("Login Berhasil", `Selamat datang, ${userInfo.name}!`, [
        {
          text: "OK",
          onPress: () => router.replace("/(tabs)"),
        },
      ]);
    } catch (error) {
      console.error("Error fetching user info:", error);
      Alert.alert("Error", "Gagal mendapatkan informasi user");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!request) {
      Alert.alert("Error", "Google Auth tidak tersedia");
      return;
    }

    console.log("Starting Google OAuth...");
    console.log("Client ID:", clientId);
    console.log("Redirect URI (Used):", redirectUri);
    console.log("Development Mode:", __DEV__);
    console.log("Expected URL: http://localhost:19006");

    setIsGoogleLoading(true);
    try {
      const result = await promptAsync();
      console.log("OAuth Result:", result);
    } catch (error) {
      console.error("Google login error:", error);
      Alert.alert(
        "Error",
        "Gagal login dengan Google: " +
          (error instanceof Error ? error.message : String(error))
      );
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Silakan isi email dan password");
      return;
    }

    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const user: User = {
        id: Date.now().toString(), // Demo ID
        name: email.split("@")[0], // Demo name from email
        email: email,
        provider: "email",
      };

      await AuthService.saveUser(user);
      await AuthService.saveToken("demo-jwt-token-" + Date.now());

      refreshAuthStatus();

      // Optional: Gunakan API service untuk login ke backend
      // try {
      //   const response = await ApiService.loginWithEmail(email, password);
      //   await AuthService.saveUser(response.user);
      //   await AuthService.saveToken(response.token);
      // } catch (error) {
      //   console.error('Login API error:', error);
      //   Alert.alert('Error', 'Email atau password salah');
      //   return;
      // }

      Alert.alert("Login Berhasil", "Anda berhasil login!", [
        {
          text: "OK",
          onPress: () => router.replace("/(tabs)"),
        },
      ]);
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Error", "Email atau password salah");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Apakah Anda yakin ingin keluar?", [
      {
        text: "Batal",
        style: "cancel",
      },
      {
        text: "Keluar",
        style: "destructive",
        onPress: async () => {
          await logout();
          refreshAuthStatus();
        },
      },
    ]);
  };

  // Jika user sudah login, tampilkan halaman profile
  if (isLoggedIn && user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />

        <ScrollView
          style={styles.profileContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Profil Saya</Text>
            <Text style={styles.subtitle}>Kelola akun dan pengaturan Anda</Text>
          </View>

          {/* User Profile Section */}
          <View style={styles.profileSection}>
            <View style={styles.profileHeader}>
              {user.picture ? (
                <Image source={{ uri: user.picture }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {user.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                <View style={styles.providerBadge}>
                  <Text style={styles.providerText}>
                    {user.provider === "google" ? "🔗 Google" : "📧 Email"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Settings Options */}
          <View style={styles.settingsSection}>
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingIcon}>
                <Text style={styles.settingIconText}>👤</Text>
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Edit Profil</Text>
                <Text style={styles.settingSubtitle}>
                  Ubah informasi pribadi Anda
                </Text>
              </View>
              <Text style={styles.settingArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingIcon}>
                <Text style={styles.settingIconText}>🔔</Text>
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Notifikasi</Text>
                <Text style={styles.settingSubtitle}>
                  Atur preferensi notifikasi
                </Text>
              </View>
              <Text style={styles.settingArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingIcon}>
                <Text style={styles.settingIconText}>🔒</Text>
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Privasi & Keamanan</Text>
                <Text style={styles.settingSubtitle}>
                  Kelola pengaturan keamanan
                </Text>
              </View>
              <Text style={styles.settingArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingIcon}>
                <Text style={styles.settingIconText}>🌙</Text>
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Mode Gelap</Text>
                <Text style={styles.settingSubtitle}>
                  Ubah tampilan aplikasi
                </Text>
              </View>
              <Text style={styles.settingArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingIcon}>
                <Text style={styles.settingIconText}>❓</Text>
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Bantuan</Text>
                <Text style={styles.settingSubtitle}>FAQ dan dukungan</Text>
              </View>
              <Text style={styles.settingArrow}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.logoutSection}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Text style={styles.logoutButtonText}>Keluar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.appInfo}>
            <Text style={styles.appInfoText}>Versi 1.0.0</Text>
            <Text style={styles.appInfoText}>© 2025 AIC App</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Selamat Datang</Text>
          <Text style={styles.subtitle}>Silakan login ke akun Anda</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#666"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#666"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Lupa Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.disabledButton]}
            onPress={handleEmailLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>atau</Text>
            <View style={styles.dividerLine} />
          </View>
          <TouchableOpacity
            style={[
              styles.googleButton,
              isGoogleLoading && styles.disabledButton,
            ]}
            onPress={handleGoogleLogin}
            disabled={isGoogleLoading || !request}
          >
            {isGoogleLoading ? (
              <ActivityIndicator color="#4285F4" />
            ) : (
              <>
                <Image
                  source={{
                    uri: "https://developers.google.com/identity/images/g-logo.png",
                  }}
                  style={styles.googleIcon}
                />
                <Text style={styles.googleButtonText}>Login dengan Google</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Belum punya akun? </Text>
          <TouchableOpacity>
            <Text style={styles.signupLink}>Daftar di sini</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  profileContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e1e5e9",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: "#4285F4",
    fontSize: 14,
    fontWeight: "500",
  },
  loginButton: {
    backgroundColor: "#4285F4",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4285F4",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.6,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e1e5e9",
  },
  dividerText: {
    marginHorizontal: 16,
    color: "#666",
    fontSize: 14,
  },
  googleButton: {
    backgroundColor: "#fff",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#e1e5e9",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  googleButtonText: {
    color: "#1a1a1a",
    fontSize: 16,
    fontWeight: "500",
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signupText: {
    color: "#666",
    fontSize: 14,
  },
  signupLink: {
    color: "#4285F4",
    fontSize: 14,
    fontWeight: "600",
  },
  // Profile/Settings styles
  profileSection: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#4285F4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  providerBadge: {
    alignSelf: "flex-start",
  },
  providerText: {
    fontSize: 12,
    color: "#4285F4",
    fontWeight: "500",
  },
  settingsSection: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settingIconText: {
    fontSize: 18,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  settingArrow: {
    fontSize: 18,
    color: "#ccc",
    fontWeight: "300",
  },
  logoutSection: {
    marginBottom: 30,
  },
  logoutButton: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ff4757",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButtonText: {
    color: "#ff4757",
    fontSize: 16,
    fontWeight: "600",
  },
  appInfo: {
    alignItems: "center",
    paddingBottom: 40,
  },
  appInfoText: {
    fontSize: 12,
    color: "#999",
    marginBottom: 4,
  },
});
