/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          main: "#2A4B8D",
          light: "#4F73B6",
          dark: "#1C3566",
          hover: "#1C3566",
          contrast: "#FFFFFF",
          text: "#FFFFFF",
        },
        secondary: {
          main: "#7E57C2",
          light: "#9D7DD3",
          dark: "#5E35B1",
          contrast: "#FFFFFF",
        },
        background: {
          page: "#F4F5F7",
          paper: "#FFFFFF",
          card: "#FFFFFF",
          input: "#FFFFFF",
          sidebar: "#2A4B8D",
          'table-header': "#F0F2F5",
          panel: "#FFFFFF",
          canvas: "#F8FAFC",
          'danger-zone': "#FEF2F2",
        },
        text: {
          primary: "#1E293B",
          secondary: "#64748B",
          disabled: "#AAB2BD",
          'sidebar-inactive': "#93C5FD",
          'sidebar-active': "#FFFFFF",
          success: "#10B981",
          heading: "#1E293B",
          body: "#64748B",
          link: "#2563EB",
          'input-placeholder': "#94A3B8",
          'table-header': "#64748B",
        },
        status: {
          success: "#10B981",
          error: "#F44336",
          warning: "#FFC107",
          'roi-positive': "#10B981",
          'roi-negative': "#EF4444",
          'warning-bg': "#FEF3C7",
          'warning-text': "#92400E",
          'active-bg': "#DCFCE7",
          'active-text': "#166534",
          'blocked-bg': "#FEE2E2",
          'blocked-text': "#991B1B",
        },
        chart: {
          'bar-fill': "#7E57C2",
          pie: {
            green: "#10B981",
            red: "#EF4444",
            yellow: "#F59E0B",
            blue: "#2A4B8D",
          },
          series: {
            '1': "#2A4B8D",
            '2': "#7E57C2",
            '3': "#10B981",
          },
        },
        border: {
          light: "#E0E0E0",
          medium: "#CCCCCC",
          divider: "#E2E8F0",
          default: "#E2E8F0",
          focus: "#2A4B8D",
          danger: "#FECACA",
        },
      },
      spacing: {
        baseline: "8px",
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
      },
      boxShadow: {
        card: "0px 2px 4px rgba(0, 0, 0, 0.08)",
        button: "0px 4px 8px rgba(0, 0, 0, 0.12)",
        dropdown: "0px 4px 12px rgba(0, 0, 0, 0.15)",
      },
    },
  },
  plugins: [],
}

