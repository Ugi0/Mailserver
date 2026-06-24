export const passwordRules = [
  {
    check: (pwd: string) => pwd.length >= 8,
    message: "At least 8 characters",
  },
  {
    check: (pwd: string) => /[A-Z]/.test(pwd),
    message: "Contains an uppercase letter",
  },
  {
    check: (pwd: string) => /[0-9]/.test(pwd),
    message: "Contains a number",
  },
  {
    check: (pwd: string) => /[^A-Za-z0-9]/.test(pwd),
    message: "Contains a special character",
  },
  {
  check: (pwd: string) => {
    const upper = pwd.toUpperCase();
    return ["C", "O", "R", "P"].every(letter => upper.includes(letter));
  }, message: "Password must contain the letters C, O, R, P (in any order)",
     subtext: "This is to make sure you're not using some old password"
  },
  {
    check: (pwd: string) => {
      const upper = pwd.toUpperCase();
      return !upper.endsWith("CORP");
    }, message: "Except at the end... I knew you would do that"
  }
];