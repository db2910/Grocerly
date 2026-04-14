'use client';

import { useState, useRef, FormEvent } from "react";
import emailjs from "@emailjs/browser";
import Link from "next/link";

// Initialize EmailJS once (required for @emailjs/browser v4+)
emailjs.init(process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!);

interface FormState {
  name: string;
  email: string;
  phone: string;
  message: string;
}

const INITIAL: FormState = { name: "", email: "", phone: "", message: "" };

export default function ContactUs() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorDetail, setErrorDetail] = useState<string>("");
  const formRef = useRef<HTMLFormElement>(null);

  const validate = (): boolean => {
    const newErrors: Partial<FormState> = {};
    if (!form.name.trim()) newErrors.name = "Name is required.";
    if (!form.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Please enter a valid email.";
    }
    if (!form.phone.trim()) newErrors.phone = "Phone number is required.";
    if (!form.message.trim()) newErrors.message = "Message is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setStatus("sending");
    try {
      const response = await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
        {
          to_email: process.env.NEXT_PUBLIC_ADMIN_EMAIL,
          user_name: form.name,
          user_email: form.email,
          user_phone: form.phone,
          reply_to: form.email,
          message: form.message,
          time: new Date().toLocaleString("en-GB", {
            dateStyle: "medium",
            timeStyle: "short",
          }),
        }
      );
      console.log("EmailJS success:", response.status, response.text);
      setStatus("success");
      setForm(INITIAL);
    } catch (err: any) {
      console.error("EmailJS error:", err);
      const detail = err?.text || err?.message || JSON.stringify(err);
      setErrorDetail(detail);
      setStatus("error");
    }
  };

  const inputClass = (field: keyof FormState) =>
    `w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors bg-slate-50 dark:bg-slate-800/60 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/30 ${
      errors[field]
        ? "border-red-400 focus:border-red-400"
        : "border-slate-200 dark:border-slate-700 focus:border-primary"
    }`;

  return (
    <div className="flex flex-col w-full flex-1">

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-white to-emerald-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 py-20 px-6">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-emerald-200/30 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center flex flex-col items-center gap-4">
          <span className="text-primary font-bold tracking-widest text-xs uppercase bg-primary/10 w-fit px-3 py-1 rounded-full">
            Contact Us
          </span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            We'd love to hear from you
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl">
            Have questions, special requests, or feedback? Send us a message and we'll get back to you as soon as possible.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-6 py-16 w-full">
        <div className="grid md:grid-cols-5 gap-12 items-start">

          {/* Left — Contact Info */}
          <div className="md:col-span-2 flex flex-col gap-8">
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-2">Get in touch</h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                Our team is available Monday to Saturday, 8 am – 8 pm.
              </p>
            </div>

            <div className="flex flex-col gap-6">
              {[
                {
                  icon: "location_on",
                  title: "Our Office",
                  lines: ["KN 4 Ave, Kigali City Tower", "Kigali, Rwanda"],
                },
                {
                  icon: "call",
                  title: "Phone",
                  lines: [process.env.NEXT_PUBLIC_ADMIN_PHONE || "+250 788 000 000", "Mon–Sat, 8 am–8 pm"],
                },
                {
                  icon: "mail",
                  title: "Email",
                  lines: [process.env.NEXT_PUBLIC_ADMIN_EMAIL || "support@grocerly.rw"],
                },
                {
                  icon: "chat",
                  title: "WhatsApp",
                  lines: ["Quick order support via WhatsApp"],
                },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{item.title}</h4>
                    {item.lines.map((l) => (
                      <p key={l} className="text-slate-500 text-sm mt-0.5">{l}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick links */}
            <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10">
              <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-3">Quick links</h4>
              <div className="flex flex-col gap-2">
                <Link href="/shop" className="text-sm text-primary font-semibold hover:underline flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">storefront</span>
                  Browse the shop
                </Link>
                <Link href="/weekly-basket" className="text-sm text-primary font-semibold hover:underline flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">shopping_basket</span>
                  Weekly baskets
                </Link>
                <Link href="/about-us" className="text-sm text-primary font-semibold hover:underline flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">info</span>
                  About Grocerly
                </Link>
              </div>
            </div>
          </div>

          {/* Right — Form */}
          <div className="md:col-span-3">
            <div className="bg-white dark:bg-slate-900 border border-primary/10 rounded-3xl shadow-xl shadow-primary/5 p-8 md:p-10">

              {status === "success" ? (
                <div className="flex flex-col items-center text-center gap-6 py-10">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-5xl text-green-500">check_circle</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-2">Message sent!</h3>
                    <p className="text-slate-500">We'll get back to you as soon as possible.</p>
                  </div>
                  <button
                    onClick={() => setStatus("idle")}
                    className="text-primary font-bold text-sm hover:underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-2">Send us a message</h2>
                  <p className="text-sm text-slate-500 mb-8">All fields are required.</p>

                  <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
                    {/* Name */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Full Name</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className={inputClass("name")}
                        placeholder="e.g. Amina Uwase"
                      />
                      {errors.name && <p className="text-xs text-red-500 mt-0.5">{errors.name}</p>}
                    </div>

                    {/* Email + Phone row */}
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Email</label>
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          className={inputClass("email")}
                          placeholder="you@example.com"
                        />
                        {errors.email && <p className="text-xs text-red-500 mt-0.5">{errors.email}</p>}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Phone Number</label>
                        <input
                          type="tel"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          className={inputClass("phone")}
                          placeholder="+250 7XX XXX XXX"
                        />
                        {errors.phone && <p className="text-xs text-red-500 mt-0.5">{errors.phone}</p>}
                      </div>
                    </div>

                    {/* Message */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Message</label>
                      <textarea
                        rows={5}
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        className={`${inputClass("message")} resize-none`}
                        placeholder="How can we help you?"
                      />
                      {errors.message && <p className="text-xs text-red-500 mt-0.5">{errors.message}</p>}
                    </div>

                    {/* Error banner */}
                    {status === "error" && (
                      <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                        <span className="material-symbols-outlined text-red-500">error</span>
                        <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                          Something went wrong{errorDetail ? `: ${errorDetail}` : ""}. Please try again or contact us via WhatsApp.
                        </p>
                      </div>
                    )}

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={status === "sending"}
                      className="mt-2 flex h-13 items-center justify-center gap-2 rounded-xl bg-primary px-8 py-4 text-sm font-bold text-white shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {status === "sending" ? (
                        <>
                          <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                          Sending…
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[20px]">send</span>
                          Send Message
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
