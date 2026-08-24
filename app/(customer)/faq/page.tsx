"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";

const questions = [
  [
    "Who is ACAB for?",
    "ACAB is built for construction businesses managing materials, suppliers, and warehouse handoffs.",
  ],
  [
    "Can I request a quotation without an account?",
    "Yes. Use the order form and our team will follow up with the details.",
  ],
  [
    "Does ACAB replace our backend?",
    "This demo uses a local workspace. It is designed to grow into your operational backend.",
  ],
];
export default function FAQPage() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
        FAQ
      </p>
      <h1 className="mt-4 text-5xl font-semibold tracking-tight">
        A few useful answers.
      </h1>
      <div className="mt-12 flex flex-col gap-3">
        {questions.map(([question, answer], index) => (
          <Card key={question} className="rounded-2xl">
            <button
              type="button"
              className="flex w-full items-center justify-between p-5 text-left font-medium"
              onClick={() => setOpen(open === index ? null : index)}
            >
              {question}
              <ChevronDown
                className={`size-4 transition-transform ${open === index ? "rotate-180" : ""}`}
              />
            </button>
            <AnimatePresence initial={false}>
              {open === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <CardContent className="pt-0 text-muted-foreground">
                    {answer}
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        ))}
      </div>
    </div>
  );
}
