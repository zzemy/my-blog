import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/components/blog/*",
                "@/components/admin/*",
                "@/components/auth/*",
                "@/components/editor/*",
                "@/components/common/*",
                "@/components/effects/*",
                "@/components/layout/*",
                "@/components/visuals/*",
                "@/components/article-content",
              ],
              message:
                "Use the new module paths under '@/features/*' or '@/shared/*' instead of legacy '@/components/*' locations.",
            },
          ],
        },
      ],
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
