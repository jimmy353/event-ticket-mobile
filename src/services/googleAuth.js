import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import * as AuthSession from "expo-auth-session";

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  const redirectUri = AuthSession.makeRedirectUri({
    useProxy: true,
  });

  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId:
      "996485176880-rfhnikqbv6poo822qbqn8bgpijt82v37.apps.googleusercontent.com",

    androidClientId:
      "996485176880-jgh11fu227d34jiepk05e77ijglmgj1c.apps.googleusercontent.com",

    iosClientId:
      "996485176880-v9iovhr80hbffkhpdc0f3hhjhne6jrb6.apps.googleusercontent.com",

    webClientId:
      "996485176880-rfhnikqbv6poo822qbqn8bgpijt82v37.apps.googleusercontent.com",

    redirectUri,
  });

  return { request, response, promptAsync };
}