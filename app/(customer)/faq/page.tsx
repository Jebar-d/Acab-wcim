"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";

const questions = [
  [
    "What types of construction materials can I inquire about?",
    "You can ask about common construction materials, hardware, electrical, plumbing, and safety supplies.",
  ],
  [
    "Can I check whether a material is available?",
    "Submit an inquiry with the materials and quantities you need. The team can review current availability.",
  ],
  [
    "How do I request a quotation?",
    "Use the Request a Quote form and include your project details, timeline, and material requirements.",
  ],
  [
    "Can I submit multiple materials in one inquiry?",
    "Yes. Include each material and quantity in the requirements field so the request stays together.",
  ],
  [
    "Do I need an account to browse materials?",
    "No. Customer pages and material information are available without an account.",
  ],
  [
    "How will I know if my inquiry has been reviewed?",
    "Our team can follow up using the contact details included with your request.",
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
