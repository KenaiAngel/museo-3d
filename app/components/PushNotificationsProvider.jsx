"use client";
import { createContext, useContext, useEffect, useState } from "react";

const PushNotificationsContext = createContext({
  isSupported: false,
  isSubscribed: false,
  permission: "default",
  subscribe: () => {},
  unsubscribe: () => {},
  loading: false,
});

export function PushNotificationsProvider({ children }) {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState("default");
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window
    ) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (!isSupported) return;
    navigator.serviceWorker.ready.then(async (registration) => {
      const sub = await registration.pushManager.getSubscription();
      setIsSubscribed(!!sub);
      setSubscription(sub);
    });
  }, [isSupported]);

  const subscribe = async () => {
    setLoading(true);
    try {
      console.log(
        "[Push] Intentando registrar Service Worker y suscribirse a push..."
      );
      const registration =
        await navigator.serviceWorker.register("/push-sw.js");
      console.log("[Push] Service Worker registrado:", registration);
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        ),
      });
      console.log("[Push] Suscripción push obtenida:", sub);
      setIsSubscribed(true);
      setSubscription(sub);
      setPermission(Notification.permission);
      // Serializar la suscripción antes de enviarla al backend
      const subJson = subscriptionToJSON(sub);
      console.log("[Push] subJson a enviar:", subJson);
      const res = await fetch("/api/push-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subJson),
      });
      console.log("[Push] Respuesta backend:", res.status);
    } catch (err) {
      console.error("[Push] Error al suscribirse a push:", err);
    }
    setLoading(false);
  };

  const unsubscribe = async () => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        setIsSubscribed(false);
        setSubscription(null);
        // Notificar al backend
        await fetch("/api/push-subscription", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
      }
    } catch (err) {
      console.error("[Push] Error al desuscribirse de push:", err);
    }
    setLoading(false);
  };

  return (
    <PushNotificationsContext.Provider
      value={{
        isSupported,
        isSubscribed,
        permission,
        subscribe,
        unsubscribe,
        loading,
        subscription,
      }}
    >
      {children}
    </PushNotificationsContext.Provider>
  );
}

export function usePushNotifications() {
  return useContext(PushNotificationsContext);
}

// Helper para convertir la clave VAPID a Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Helper para serializar la suscripción push
function subscriptionToJSON(subscription) {
  if (!subscription) return null;
  const rawKey = subscription.getKey("p256dh");
  const rawAuthSecret = subscription.getKey("auth");
  return {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: rawKey
        ? btoa(String.fromCharCode.apply(null, new Uint8Array(rawKey)))
        : null,
      auth: rawAuthSecret
        ? btoa(String.fromCharCode.apply(null, new Uint8Array(rawAuthSecret)))
        : null,
    },
  };
}
