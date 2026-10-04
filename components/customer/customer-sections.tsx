"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, type Variants } from "motion/react";

import { Button } from "@/components/ui/button";
import RoundCarousel from "@/components/originkit/ui/roundcarousel-custom-style";
import { VehicleDescendSection } from "@/components/customer/scene3d/vehicle-scroll-section";
import { MaterialsCarouselSection } from "@/components/customer/scene3d/materials-carousel-section";
import { WorkerCalloutSection } from "@/components/customer/worker-callout-section";

const fadeUp: Variants = {
  hidden: {
    opacity: 0,
    y: 18,
  },

  show: {
    opacity: 1,
    y: 0,

    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const revealContainer: Variants = {
  hidden: {},

  show: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.05,
    },
  },
};

const HERO_RING_IMAGES = [
  { src: "/img1.jpe" },
  { src: "/img3.jpe" },
  { src: "/img6.jpg" },
  { src: "/lumber.jpg" },
  { src: "/steel bars.jpg" },
  { src: "/pipes.jpe" },
  { src: "/cement.webp" },
  { src: "/img8.png" },
];

export function CustomerHomeSections() {
  return (
    <>
      {/* =========================================================
          LANDING PAGE
          ========================================================= */}

      <section
        className="
          relative
          h-[700px]
          w-full
          overflow-hidden
          bg-white
          text-black
        "
      >
        {/* =======================================================
            GIANT ACAB WCIM LETTERING
            ======================================================= */}

        <div
          className="
            pointer-events-none
            absolute
            left-1/2
            top-[20px]
            z-0
            w-[100vw]
            -translate-x-1/2
            select-none
          "
        >
          <Image
            src="/brand/acab-wcim.png"
            alt="ACAB WCIM"
            width={1440}
            height={371}
            priority
            className="
              block
              h-auto
              w-full
            "
          />
        </div>

        {/* =======================================================
            CAROUSEL

            KEEP THIS AT top-[310px]
            ======================================================= */}

        <div
          className="
            absolute
            left-1/2
            top-[310px]
            z-10
            h-[280px]
            w-full
            -translate-x-1/2
          "
        >
          <RoundCarousel
            images={HERO_RING_IMAGES}
            background="transparent"
            imageWidth={240}
            imageHeight={145}
            spacing={0}
            speed={5}
            direction="right"
            drag
            sensitivity={5}
            tilt={-23}
            perspective={3000}
            cornerRadius={0}
            innerDim={3.5}
            style={{
              width: "100%",
              height: "280px",
            }}
          />
        </div>

        {/* =======================================================
            THREE TEXT PARAGRAPHS
            ======================================================= */}

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{
            once: true,
            amount: 0.2,
          }}
          variants={revealContainer}
          className="
            absolute
            left-[22px]
            right-[22px]
            top-[525px]
            z-20
            grid
            grid-cols-3
            gap-[54px]
          "
        >
          {/* LEFT */}

          <motion.p
            variants={fadeUp}
            className="
              max-w-[405px]
              text-left
              text-[16px]
              font-semibold
              leading-[1.32]
              tracking-[-0.01em]
            "
          >
            Warehouse construction requires careful coordination of materials,
            equipment, and resources throughout every stage of the project. An
            organized inventory system helps teams monitor available supplies,
            record incoming deliveries, and ensure that essential construction
            materials are ready when needed.
          </motion.p>

          {/* CENTER */}

          <motion.p
            variants={fadeUp}
            className="
              mx-auto
              max-w-[430px]
              text-center
              text-[16px]
              font-semibold
              leading-[1.32]
              tracking-[-0.01em]
            "
          >
            Inventory management also helps reduce material waste, prevent
            unnecessary purchases, and maintain accurate stock levels. By
            keeping records of items such as steel, cement, lumber, electrical
            supplies, and other construction materials, warehouse staff can
            quickly identify shortages and manage resources more efficiently.
          </motion.p>

          {/* RIGHT */}

          <motion.p
            variants={fadeUp}
            className="
              ml-auto
              max-w-[405px]
              text-right
              text-[16px]
              font-semibold
              leading-[1.32]
              tracking-[-0.01em]
            "
          >
            A well-managed warehouse allows construction projects to run
            smoothly from material procurement to final delivery. With accurate
            inventory tracking, clear stock records, and timely updates, project
            managers and staff can make better decisions, control costs, and
            keep construction schedules on track.
          </motion.p>
        </motion.div>
      </section>

      {/* =========================================================
          INQUIRY / REQUEST SECTION
          ========================================================= */}

      {/* =========================================================
    INQUIRY / REQUEST PAGE
    ========================================================= */}
      <section
        className="
    relative
    h-[678px]
    w-full
    overflow-hidden
    bg-[#242424]
    px-6
    text-white
  "
      >
        {/* =======================================================
      LEFT ACAB
      ======================================================= */}
        <div
          className="
      pointer-events-none
      absolute
      left-[4%]
      top-[42px]
      z-0
      w-[27%]
      max-w-[330px]
      select-none
    "
        >
          <Image
            src="/brand/acab.png"
            alt="ACAB"
            width={330}
            height={511}
            className="
        h-auto
        w-full
        invert
      "
          />
        </div>

        {/* =======================================================
      RIGHT WCIM
      ======================================================= */}
        <div
          className="
      pointer-events-none
      absolute
      right-[4%]
      top-[42px]
      z-0
      w-[27%]
      max-w-[308px]
      select-none
    "
        >
          <Image
            src="/brand/wcim.png"
            alt="WCIM"
            width={308}
            height={492}
            className="
        h-auto
        w-full
        invert
      "
          />
        </div>

        {/* =======================================================
      VEHICLE
      =======================================================
      This container controls ONLY the vehicle.
      It does NOT affect the bottom text.
      ======================================================= */}
        <div
          className="
      absolute
      left-1/2
      top-[25px]
      z-10
      h-[500px]
      w-[62%]
      min-w-[520px]
      -translate-x-1/2
    "
        >
          <VehicleDescendSection />
        </div>

        {/* =======================================================
      BOTTOM CONTENT
      =======================================================
      Completely independent from the vehicle.
      ======================================================= */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{
            once: true,
            amount: 0.3,
          }}
          variants={revealContainer}
          className="
      absolute
      bottom-[25px]
      left-1/2
      z-20
      grid
      w-[calc(100%-48px)]
      max-w-[1280px]
      -translate-x-1/2
      items-end
      gap-8
      md:grid-cols-[1fr_auto_1fr]
    "
        >
          {/* =====================================================
        LEFT TEXT
        ===================================================== */}
          <motion.p
            variants={fadeUp}
            className="
        max-w-[410px]
        text-center
        text-[16px]
        font-semibold
        leading-[1.32]
        tracking-[-0.01em]
        text-white
        md:text-left
      "
          >
            Our inquiry process makes it easy to request the construction
            materials and warehouse supplies you need. Provide your project
            details, required materials, quantities, and preferred schedule so
            our team can review your request and prepare an accurate quotation.
          </motion.p>

          {/* =====================================================
        REQUEST QUOTATION BUTTON
        ===================================================== */}
          <motion.div
            variants={fadeUp}
            className="
        flex
        justify-center
      "
          >
            <Button
              size="lg"
              render={<Link href="/inquire">Request quotation</Link>}
            />
          </motion.div>

          {/* =====================================================
        RIGHT TEXT
        ===================================================== */}
          <motion.p
            variants={fadeUp}
            className="
        ml-auto
        max-w-[410px]
        text-center
        text-[16px]
        font-semibold
        leading-[1.32]
        tracking-[-0.01em]
        text-white
        md:text-right
      "
          >
            Once your inquiry has been reviewed, our staff will confirm the
            available materials, estimated costs, and delivery details. You can
            then review the quotation and choose your preferred payment and
            transaction method before proceeding with your order.
          </motion.p>
        </motion.div>
      </section>

      {/* =========================================================
          MATERIALS SECTION
          ========================================================= */}

      <MaterialsCarouselSection />

      {/* =========================================================
          WORKER CALLOUT
          ========================================================= */}

      <WorkerCalloutSection />
    </>
  );
}
