import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-outfit)", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))"
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))"
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        },
        "surface-dim": "#15121c",
        "on-primary-container": "#fffbff",
        "on-secondary-fixed": "#001e2f",
        "on-primary-fixed-variant": "#5a00c6",
        "error": "#ed2b4d",
        "primary-container": "#8b4aff",
        "border-subtle": "rgba(255, 255, 255, 0.05)",
        "surface-bright": "#3c3743",
        "surface-container-highest": "#37333e",
        "on-tertiary-fixed": "#2f1500",
        "error-container": "#93000a",
        "outline-variant": "#4a4455",
        "surface-container-low": "#1d1a24",
        "outline": "#958da1",
        "on-secondary-fixed-variant": "#004c6e",
        "on-secondary": "#00344d",
        "inverse-on-surface": "#332e3a",
        "on-secondary-container": "#00324a",
        "tertiary-container": "#b25f00",
        "surface-container-lowest": "#100d16",
        "on-tertiary": "#4e2600",
        "on-tertiary-container": "#fffcff",
        "on-error-container": "#ffdad6",
        "on-primary-fixed": "#25005a",
        "tertiary-fixed": "#ffdcc3",
        "on-surface-variant": "#ccc3d8",
        "on-error": "#690005",
        "tertiary": "#ffb77e",
        "inverse-primary": "#742be7",
        "primary-fixed": "#eaddff",
        "surface-container-high": "#2c2833",
        "on-primary": "#3f008e",
        "surface-container": "#221e28",
        "surface-variant": "#37333e",
        "on-background": "#e8dfee",
        "secondary-fixed-dim": "#88ceff",
        "surface-tint": "#d2bbff",
        "secondary-container": "#009fe2",
        "tertiary-fixed-dim": "#ffb77e",
        "inverse-surface": "#e8dfee",
        "primary-fixed-dim": "#d2bbff",
        "on-tertiary-fixed-variant": "#6e3900",
        "secondary-fixed": "#c8e6ff",
        "surface": "#0e0e11",
        "on-surface": "#e8dfee"
      },
      borderRadius: {
        lg: "8px",
        md: "6px",
        sm: "4px"
      },
      boxShadow: {
        soft: "0 14px 44px rgba(0, 0, 0, 0.32)"
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" }
        }
      },
      animation: {
        "fade-up": "fade-up 220ms ease-out both",
        "gradient-shift": "gradient-shift 8s ease infinite"
      }
    }
  },
  plugins: []
};

export default config;
