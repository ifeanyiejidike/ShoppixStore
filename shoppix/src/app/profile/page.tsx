// src/app/profile/page.tsx

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "My Profile | Shoppix",
  description: "Manage your Shoppix account, orders, saved items, and account details.",
};

const recentOrders = [
  {
    id: "ORD-1001",
    date: "2026-03-10",
    status: "Delivered",
    total: "$129.99",
  },
  {
    id: "ORD-1002",
    date: "2026-03-12",
    status: "Processing",
    total: "$64.99",
  },
];

const savedItems = [
  {
    id: "1",
    name: "Classic Leather Backpack",
    price: "$89.99",
  },
  {
    id: "2",
    name: "Minimal White Sneakers",
    price: "$64.99",
  },
];

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
            Account
          </span>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            My profile
          </h1>

          <p className="mt-4 text-base leading-7 text-slate-600">
            Manage your account details, review recent orders, and keep track of saved products.
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-xl font-bold text-white">
                IE
              </div>

              <div>
                <h2 className="text-xl font-semibold text-slate-950">Ifeanyi Ejidike</h2>
                <p className="text-sm text-slate-500">ifeanyi@example.com</p>
              </div>
            </div>

            <dl className="mt-6 space-y-4">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                <dt className="text-sm font-medium text-slate-500">Phone</dt>
                <dd className="text-sm font-semibold text-slate-900">+234 800 000 0000</dd>
              </div>

              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                <dt className="text-sm font-medium text-slate-500">Membership</dt>
                <dd className="text-sm font-semibold text-slate-900">Premium customer</dd>
              </div>

              <div className="flex items-start justify-between gap-4 pb-1">
                <dt className="text-sm font-medium text-slate-500">Address</dt>
                <dd className="text-right text-sm font-semibold text-slate-900">
                  24 Market Road
                  <br />
                  Port Harcourt, Nigeria
                </dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Edit profile
              </button>

              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                Account settings
              </button>
            </div>
          </aside>

          <div className="space-y-8">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold text-slate-950">Recent orders</h2>
                <Link
                  href="/product"
                  className="text-sm font-semibold text-slate-700 transition hover:text-slate-950"
                >
                  Continue shopping
                </Link>
              </div>

              <div className="mt-5 space-y-4">
                {recentOrders.map((order) => (
                  <article
                    key={order.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">{order.id}</p>
                        <p className="text-sm text-slate-500">{order.date}</p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900">{order.total}</p>
                        <p className="text-sm text-slate-500">{order.status}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold text-slate-950">Saved items</h2>
                <Link
                  href="/product"
                  className="text-sm font-semibold text-slate-700 transition hover:text-slate-950"
                >
                  View catalog
                </Link>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {savedItems.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <h3 className="text-base font-semibold text-slate-950">{item.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">{item.price}</p>

                    <Link
                      href={`/product/${item.id}`}
                      className="mt-4 inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      View item
                    </Link>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}