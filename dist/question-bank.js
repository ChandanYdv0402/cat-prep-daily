"use strict";

window.CAT_QUESTION_BANK = {
  sample: true,
  releaseDate: null,
  sets: [{
    id: "sample-set",
    groups: [{
      section: "QA",
      questions: [{
        topic: "Profit and loss",
        prompt: "A retailer marks an item 40% above cost and gives a 15% discount on the marked price. What is the profit percentage?",
        options: ["15%", "19%", "21%", "25%"],
        answer: "B. 19%",
        solution: "Let the cost be ₹100. The marked price is ₹140. After the discount, the selling price is ₹140 × 0.85 = ₹119. The profit is ₹19 on a cost of ₹100, or 19%.",
      }, {
        topic: "Mixtures",
        prompt: "A tank holds 60 litres of a milk-and-water mixture in the ratio 2:1. After removing 15 litres of the mixture, how many litres of water must be added to make the new ratio 3:2?",
        answer: "5 litres",
        solution: "The 45 litres remaining have 30 litres of milk and 15 litres of water. For a milk-to-water ratio of 3:2, 30 litres of milk requires 20 litres of water. Add 20 − 15 = 5 litres.",
      }, {
        topic: "Algebra",
        prompt: "If x + 1/x = 3, what is the value of x³ + 1/x³?",
        options: ["15", "18", "21", "24"],
        answer: "B. 18",
        solution: "Expand (x + 1/x)³ to get x³ + 1/x³ + 3(x + 1/x). Substitute 3 and rearrange to get 27 − 9 = 18.",
      }, {
        topic: "Geometry",
        prompt: "A right triangle has a hypotenuse of 25 cm and an inradius of 4 cm. What is its area in square centimetres?",
        answer: "116 cm²",
        solution: "For legs a and b and hypotenuse c, the inradius is (a + b − c)/2. So a + b = 33. Using (a + b)² = a² + b² + 2ab and a² + b² = 625 gives 2ab = 1,089 − 625 = 464. The area is ab/2 = 116 cm².",
      }, {
        topic: "Time and work",
        prompt: "A can complete a job in 12 days and B in 18 days. They work together for 4 days. How many additional days does B need to finish the job alone?",
        options: ["6 days", "7 days", "8 days", "10 days"],
        answer: "C. 8 days",
        solution: "Their combined daily rate is 1/12 + 1/18 = 5/36. They finish 20/36 = 5/9 of the job in four days, leaving 4/9. At 1/18 of the job per day, B needs (4/9) ÷ (1/18) = 8 days.",
      }],
    }, {
      section: "DILR",
      title: "Library borrowing",
      context: "Four branches recorded their weekly loans. Each loan falls into exactly one of two categories, fiction or nonfiction.\n\nNorth: 120 loans, 45% fiction\nEast: 150 loans, 60% fiction\nSouth: 180 loans, 50% fiction\nWest: 200 loans, 35% fiction",
      questions: [{
        prompt: "Which branch recorded the highest number of nonfiction loans?",
        options: ["North", "East", "South", "West"],
        answer: "D. West",
        solution: "Multiply total loans by the nonfiction share. North had 120 × 55% = 66, East had 150 × 40% = 60, South had 180 × 50% = 90, and West had 200 × 65% = 130.",
      }, {
        prompt: "What percentage of all loans across the four branches were fiction? Round to one decimal place and enter the number without the percent sign.",
        answer: "46.8%",
        solution: "The fiction counts were 54, 90, 90, and 70, for a total of 304 out of 650 loans. The share was 304 ÷ 650 × 100 = 46.77…%, which rounds to 46.8%.",
      }, {
        prompt: "If East records additional nonfiction loans while its fiction count stays fixed, how many additional loans would bring its fiction share to exactly 50%?",
        answer: "30 loans",
        solution: "East had 90 fiction loans and 60 nonfiction loans. A 50% fiction share requires 90 of each category, so East needs 30 extra nonfiction loans.",
      }, {
        prompt: "If a loan is selected at random from all fiction loans across the four branches, what is the probability that it was recorded by North?",
        options: ["27/152", "9/65", "6/35", "27/125"],
        answer: "A. 27/152",
        solution: "North recorded 120 × 45% = 54 fiction loans. There were 304 fiction loans across the four branches. The probability is 54/304 = 27/152.",
      }],
    }, {
      section: "VARC",
      title: "Reading comprehension",
      context: "When cities digitize their records, they often begin with maps and photographs. These materials make attractive exhibits, but the mundane documents that follow can change how a city understands itself. A register of pothole complaints, for example, tracks who had the means and confidence to report a problem as much as it tracks the condition of the roads. As databases make such records easier to search, it becomes tempting to treat gaps as evidence that nothing happened. The value of a digital archive therefore depends partly on how well it preserves the circumstances under which records were made, including which voices the original system was designed to hear.",
      questions: [{
        prompt: "Which statement best captures the main point of the passage?",
        options: [
          "Municipal archives should give everyday documents priority over photographs.",
          "Digitizing records improves their reliability by making patterns easier to verify.",
          "Searchable archives need context about how records were produced to support sound interpretation.",
          "Municipal complaint records are useful mainly when road conditions are also available.",
        ],
        answer: "C. Searchable archives need context about how records were produced to support sound interpretation.",
        solution: "The author uses the complaint register to show how records reflect the reporting process. The concluding sentence makes the broader point that searchable records need that context to be read well.",
      }, {
        prompt: "What is the pothole register example used to illustrate?",
        options: [
          "Administrative records can reflect who participates in reporting as well as what gets reported.",
          "Routine complaints are usually more accurate than official photographs.",
          "Searching complaints by neighbourhood removes bias in the original records.",
          "Reporting confidence is the primary cause of unequal road maintenance.",
        ],
        answer: "A. Administrative records can reflect who participates in reporting as well as what gets reported.",
        solution: "The example explicitly links complaint data both to road conditions and to residents’ capacity and willingness to report them.",
      }, {
        prompt: "Which inference is most consistent with the passage?",
        options: [
          "A district with fewer recorded complaints must have received more road maintenance.",
          "Evidence that districts had unequal access to complaint channels would matter when comparing their records.",
          "A digitized database makes gaps in city records less likely to be misinterpreted.",
          "The original purpose of a city record matters only when the document has visible omissions.",
        ],
        answer: "B. Evidence that districts had unequal access to complaint channels would matter when comparing their records.",
        solution: "If reporting access differed, two districts with similar road conditions could produce different complaint counts. The passage argues that information about how a record was created is essential to interpreting it.",
      }],
    }],
  }],
};
