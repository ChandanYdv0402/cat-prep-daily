"use strict";

(() => {
  const names = ["Chandan", "smitjy", "Amritesh Raj"];
  const platforms = {
    leetcode: { title: "LeetCode", short: "LC", profile: "https://leetcode.com/u/" },
    codechef: { title: "CodeChef", short: "CC", profile: "https://www.codechef.com/users/" },
    codeforces: { title: "Codeforces", short: "CF", profile: "https://codeforces.com/profile/" },
  };

  async function load() {
    const response = await fetch("api/coding", { cache: "no-store", signal: AbortSignal.timeout(90000) });
    if (!response.ok) throw new Error("Coding data request failed");
    return response.json();
  }

  window.CodingData = { names, platforms, load };
})();
