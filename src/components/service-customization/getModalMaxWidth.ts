interface ModalWidthInput {
  mainStage: number;
  isCustomPlan: boolean;
  isWeeklyPlan: boolean;
  isMonthlyPlan: boolean;
}

export const getModalMaxWidth = ({
  mainStage,
  isCustomPlan,
  isWeeklyPlan,
  isMonthlyPlan,
}: ModalWidthInput) =>
  mainStage === 3
    ? "max-w-4xl lg:max-w-5xl"
    : mainStage === 1 && isCustomPlan
      ? "max-w-5xl xl:max-w-6xl"
      : mainStage === 1 && (isMonthlyPlan || isWeeklyPlan)
        ? "max-w-4xl lg:max-w-5xl"
        : mainStage === 1
          ? "max-w-2xl sm:max-w-3xl"
          : mainStage === 2
            ? "max-w-3xl"
            : mainStage === 4
              ? "max-w-2xl"
              : "max-w-xl";
