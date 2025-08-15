import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function AppPage() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Back button */}
      <Pressable
        onPress={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace("/");
          }
        }}
        style={styles.backButton}
      >
        <Ionicons name="arrow-back" size={24} color="black" />
      </Pressable>

      <Text style={styles.text}>Alert shop test</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  backButton: {
    marginBottom: 16,
  },
  text: {
    fontSize: 24,
    fontWeight: "bold",
    color: "black",
  },
});
