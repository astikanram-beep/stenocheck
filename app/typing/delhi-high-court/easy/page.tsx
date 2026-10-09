"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  doc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

import { db, auth } from "../../../../lib/firebase";
import SubscriptionModal from "@/components/SubscriptionModal";

type Passage = {
  id: string;
  passageNumber: number;
  text: string;
  wordCount: number;
  access: "free" | "paid";
  active: boolean;
};

export default function DelhiHighCourtEasy() {
  const router = useRouter();

  const [passages, setPassages] = useState<Passage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSubscription, setShowSubscription] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(false);

  const [subscriptionActive, setSubscriptionActive] =
    useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(
      auth,
      async (user) => {
        if (!user) {
          setSubscriptionActive(false);
          return;
        }

        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);

          if (!userSnap.exists()) {
            setSubscriptionActive(false);
            return;
          }

          const data = userSnap.data();
          const subscription = data.subscription;

          if (
            subscription?.active === true &&
            subscription?.expiryDate
          ) {
            const expiryTime = new Date(
              subscription.expiryDate
            ).getTime();

            const now = Date.now();

            setSubscriptionActive(
              expiryTime > now
            );
          } else {
            setSubscriptionActive(false);
          }
        } catch (error) {
          console.error(
            "SUBSCRIPTION CHECK ERROR:",
            error
          );

          setSubscriptionActive(false);
        }
      }
    );

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    const passagesRef = collection(
      db,
      "dhcPassages",
      "easy",
      "passages"
    );

    const passagesQuery = query(
      passagesRef,
      orderBy("passageNumber", "asc")
    );

    const unsubscribe = onSnapshot(
      passagesQuery,
      (snapshot) => {
        const loaded: Passage[] = [];

        snapshot.forEach((item) => {
          const data = item.data();

          if (data.active !== false) {
            loaded.push({
              id: item.id,
              passageNumber: data.passageNumber || 1,
              text: data.text || "",
              wordCount: data.wordCount || 0,
              access: data.access || "free",
              active: data.active ?? true,
            });
          }
        });

        setPassages(loaded);
        setLoading(false);
      },
      (error) => {
        console.error(
          "EASY PASSAGES LOAD ERROR:",
          error
        );

        setPassages([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  async function handlePassageClick(
    passage: Passage
  ) {
    if (passage.access === "free") {
      router.push(
        `/typing/delhi-high-court/test?difficulty=easy&passage=${passage.passageNumber}`
      );
      return;
    }

    setCheckingSubscription(true);

    try {
      const user = auth.currentUser;

      if (!user) {
        alert(
          "Please login before accessing paid passages."
        );

        setShowSubscription(true);
        return;
      }

      const userRef = doc(
        db,
        "users",
        user.uid
      );

      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        setSubscriptionActive(false);
        setShowSubscription(true);
        return;
      }

      const data = userSnap.data();
      const subscription = data.subscription;

      const expiryTime = subscription?.expiryDate
        ? new Date(
            subscription.expiryDate
          ).getTime()
        : 0;

      const active =
        subscription?.active === true &&
        expiryTime > Date.now();

      setSubscriptionActive(active);

      if (active) {
        router.push(
          `/typing/delhi-high-court/test?difficulty=easy&passage=${passage.passageNumber}`
        );
      } else {
        setShowSubscription(true);
      }
    } catch (error) {
      console.error(
        "PAID PASSAGE ACCESS ERROR:",
        error
      );

      setShowSubscription(true);
    } finally {
      setCheckingSubscription(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10">
      <div className="mx-auto max-w-6xl">

        <button
          onClick={() =>
            router.push(
              "/typing/delhi-high-court"
            )
          }
          className="mb-8 text-sm font-semibold text-slate-600 hover:text-blue-600"
        >
          ← Back to Difficulty Levels
        </button>

        <div className="mb-10">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-bold text-emerald-700">
              EASY
            </span>

            <span className="rounded-full bg-blue-100 px-4 py-1.5 text-sm font-semibold text-blue-700">
              {passages.length} Passages
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-extrabold text-slate-900">
            Delhi High Court — Easy Practice
          </h1>

          <p className="mt-2 max-w-2xl text-slate-600">
            Select a passage below to start your Delhi High Court
            typing practice.
          </p>
        </div>

        <div className="mb-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex gap-3">
            <div className="text-2xl">🔓</div>

            <div>
              <h2 className="font-bold text-emerald-900">
                Free & Paid passages
              </h2>

              <p className="mt-1 text-sm text-emerald-800">
                Paid passages are unlocked with an active subscription.
              </p>
            </div>
          </div>
        </div>

        {loading && (
          <div className="rounded-2xl bg-white p-10 text-center font-semibold text-slate-500 shadow-sm">
            Loading passages...
          </div>
        )}

        {!loading && passages.length === 0 && (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="font-bold text-slate-700">
              No active passages available.
            </p>
          </div>
        )}

        {!loading && passages.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {passages.map((passage) => {
              const isFree =
                passage.access === "free";

              return (
                <button
                  key={passage.id}
                  onClick={() =>
                    handlePassageClick(passage)
                  }
                  disabled={checkingSubscription}
                  className={`group rounded-2xl border bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
                    isFree
                      ? "border-emerald-200 hover:border-emerald-400"
                      : "border-slate-200 hover:border-blue-300"
                  }`}
                >
                  <div className="flex items-start justify-between">

                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${
                        isFree
                          ? "bg-emerald-50"
                          : "bg-slate-100"
                      }`}
                    >
                      {isFree ? "🔓" : "🔒"}
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        isFree
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      {isFree ? "FREE" : "PAID"}
                    </span>
                  </div>

                  <h2 className="mt-5 text-lg font-bold text-slate-900">
                    Passage{" "}
                    {String(
                      passage.passageNumber
                    ).padStart(2, "0")}
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    {passage.wordCount || 400} words • 10 minutes
                  </p>

                  <div
                    className={`mt-5 text-sm font-bold ${
                      isFree
                        ? "text-emerald-600"
                        : "text-blue-600"
                    }`}
                  >
                    {checkingSubscription
                      ? "Checking access..."
                      : isFree
                      ? "Start Practice →"
                      : subscriptionActive
                      ? "Start Practice →"
                      : "Unlock Passage →"}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <SubscriptionModal
          open={showSubscription}
          onClose={() =>
            setShowSubscription(false)
          }
        />
      </div>
    </main>
  );
}