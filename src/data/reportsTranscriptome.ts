import type { DataPair } from "@/lib/data";

/** Transcriptome report (captures: transcriptome_report/top, scroll_1…14). Copy extracted from the XML dumps. */
export type CellIcon = "cell_t" | "cell_b" | "cell_mono" | "cell_dc" | "cell_nk" | "cell_neut" | "cell_baso" | "cell_plasma";

export interface CellType {
  name: string;
  icon: CellIcon;
  value: string;
  num: number;
  min: number;
  max: number;
  status: string;
  description: string;
  analysis: string;
  recommendations: string;
}

export interface EstimateCard {
  icon: "hourglass" | "weight" | "lungs";
  title: string;
  /** optional classification pill (Smoking Exposure) */
  pill?: { label: string; value: string };
  /** 2-column grid; first value of the first row is the navy headline */
  grid: [string, string][];
  means: string;
  missing: number;
}

export interface TranscriptomeReport {
  score: number;
  normal: number;
  attention: number;
  overview: string;
  estimates: EstimateCard[];
  disclaimer: string;
  disease: { intro: string; healthy: string; healthyNote: string; signals: string[]; means: string; coverage: [string, string][]; axes: number; disclaimer: string };
  cells: CellType[];
}

const report: TranscriptomeReport = {
  score: 100,
  normal: 8,
  attention: 0,
  overview: "This section summarizes how the sample gene-expression profile compares with reference patterns for aging, body mass index, and smoking exposure. The values reflect molecular signals present at the time of collection rather than direct clinical measurements.",
  estimates: [
    {
      icon: "hourglass",
      title: "Biological Age",
      grid: [
        ["Predicted age", "40.2 years"],
        ["Chronological age", "44.0 years"],
        ["Age difference", "-3.8 years"],
        ["Reference percentile", "44.9%"],
      ],
      means: "Your gene-expression age estimate is 3.8 years younger than your chronological age. This may be a favorable signal, but it does not measure overall health.",
      missing: 0,
    },
    {
      icon: "weight",
      title: "Transcriptomic BMI",
      grid: [
        ["Predicted BMI", "25.5"],
        ["Reference percentile", "45.6%"],
      ],
      means: "Your transcriptomic BMI estimate is 25.5, at the 45.6% reference percentile. Compare this model estimate with your measured BMI and metabolic assessment.",
      missing: 0,
    },
    {
      icon: "lungs",
      title: "Smoking Exposure",
      pill: { label: "Model classification", value: "Likely non-smoker" },
      grid: [
        ["Smoking probability", "41.4%"],
        ["Reference percentile", "61.0%"],
      ],
      means: "Your sample was classified as Likely non-smoker, with a model probability of 41.4%. Compare this result with current exposure information and clinical history.",
      missing: 0,
    },
  ],
  disclaimer: "These are screening-level molecular estimates, not diagnoses. Sample quality, collection timing, current health state, medication use, and differences from the reference population may influence the results; interpret them alongside measured clinical data and patient history.",
  disease: {
    intro: "The transcriptomic profile is evaluated across 45 disease-related model axes. Each axis is compared with a healthy reference distribution and ranked by model probability; the result describes molecular similarity and does not confirm disease.",
    healthy: "96.5%",
    healthyNote: "Probability assigned to the healthy reference class by the disease model. This is not a general health score.",
    signals: ["Healthy", "Retinal Vein Occlusion", "Renal Stones"],
    means: "No disease axis meets High or Moderate confidence criteria. The complete ranking remains available in the appendix.",
    coverage: [
      ["Disease axes reported", "45"],
      ["Model genes used", "600"],
      ["Missing model genes", "0"],
      ["Highest confidence", "Low"],
    ],
    axes: 45,
    disclaimer: "Disease-axis results describe molecular similarity only and do not establish or exclude a diagnosis. Review elevated signals with symptoms, medical history, examination findings, and appropriate confirmatory testing.",
  },
  cells: [
    {
      name: "T Cells",
      icon: "cell_t",
      value: "36.50%",
      num: 36.5,
      min: 3.5,
      max: 58.1,
      status: "Normal",
      description: "T cells, or T lymphocytes, are a subset of white blood cells that play a critical role in cell-mediated immunity. Unlike B cells, which produce antibodies, T cells directly attack infected or cancerous cells. There are several types of T cells, each with a specific function: helper T cells (CD4+), which activate other immune cells; cytotoxic T cells (CD8+), which destroy virus-infected cells and tumors; regulatory T cells, which maintain immune tolerance; and memory T cells, which provide long-lasting immunity. T cells originate in the bone marrow but mature in the thymus, hence their name. They are essential for a robust immune defense against pathogens, tumors, and other foreign invaders.",
      analysis: "Normal T cell levels are indicative of a well-functioning immune system capable of responding to infections and malignancies effectively. A balanced T cell population ensures that the immune system can both attack foreign pathogens and regulate itself to prevent excessive inflammation. The presence of memory T cells also provides long-term immunity against previously encountered pathogens, reducing the likelihood of reinfection. Normal levels suggest that the body is well-equipped to handle infections, cancerous cells, and other immune challenges, maintaining overall health and stability in the immune system.",
      recommendations: "Maintaining normal T cell levels involves a balanced lifestyle that includes regular exercise, a nutritious diet rich in antioxidants, and stress management techniques such as mindfulness or yoga. Adequate sleep is also crucial for supporting immune function. Regular health check-ups and vaccinations can help prevent infections that might challenge the immune system. Avoiding smoking and excessive alcohol consumption is also important, as these can negatively impact T cell function.",
    },
    {
      name: "B Cells",
      icon: "cell_b",
      value: "8.52%",
      num: 8.52,
      min: 0.0,
      max: 11.8,
      status: "Normal",
      description: "B cells, or B lymphocytes, are a vital component of the adaptive immune system, responsible for the production of antibodies. These antibodies are specific proteins that bind to pathogens, such as bacteria and viruses, marking them for destruction by other immune cells. B cells originate and mature in the bone marrow, where they undergo a selection process to ensure that they do not react against the body's own tissues. Once activated by encountering their specific antigen, B cells differentiate into plasma cells that secrete large quantities of antibodies or into memory B cells that provide long-lasting immunity. This process is essential for the body's ability to mount a rapid and effective response upon subsequent exposures to the same pathogen.",
      analysis: "Normal B cell levels are essential for a healthy immune response, particularly in the production of antibodies that target and neutralize pathogens. A balanced B cell population ensures that the body can effectively respond to infections, while memory B cells provide long-term protection against previously encountered pathogens. Normal levels suggest that the immune system is capable of producing a robust and targeted response to infections, as well as maintaining immunological memory, which is crucial for long-term immunity and overall health.",
      recommendations: "To maintain normal B cell levels, it is important to support overall immune health through a balanced diet rich in nutrients, regular physical activity, and stress management. Vaccination is also crucial for protecting against infections, particularly for those who may be at higher risk. Avoiding smoking and limiting alcohol consumption can also help maintain a healthy immune system. Regular health check-ups and monitoring of immune function can help detect any changes in B cell levels early.",
    },
    {
      name: "Monocytes",
      icon: "cell_mono",
      value: "7.63%",
      num: 7.63,
      min: 0.0,
      max: 20.1,
      status: "Normal",
      description: "Monocytes are a type of white blood cell and part of the body's innate immune system. They are produced in the bone marrow and circulate in the blood, where they play a role in phagocytosis—the process of engulfing and digesting cellular debris, pathogens, and other foreign substances. Upon migrating into tissues, monocytes differentiate into macrophages and dendritic cells, which are critical for antigen presentation and the initiation of adaptive immune responses. Monocytes also secrete cytokines, signaling molecules that modulate the activity of other immune cells. Their ability to differentiate and respond to various stimuli makes them a key player in both the immediate and long-term immune responses.",
      analysis: "Normal monocyte levels are indicative of a well-functioning innate immune system capable of responding rapidly to infections and injuries. A normal monocyte count ensures that the body can effectively clear pathogens and initiate the appropriate adaptive immune response. Normal levels also suggest that the immune system is in balance, with the ability to mount a defense without causing excessive inflammation or tissue damage. Maintaining normal monocyte levels is essential for overall immune health and the prevention of chronic inflammation.",
      recommendations: "To maintain normal monocyte levels, it is important to support overall immune health through a balanced diet, regular exercise, and adequate sleep. Stress management techniques, such as mindfulness or meditation, can also help maintain a healthy immune system. Avoiding smoking and limiting alcohol consumption can further support immune function. Regular health check-ups and monitoring of immune function can help detect any changes in monocyte levels early, allowing for prompt intervention if needed.",
    },
    {
      name: "Dendritic Cells",
      icon: "cell_dc",
      value: "0.69%",
      num: 0.69,
      min: 0.0,
      max: 6.2,
      status: "Normal",
      description: "Dendritic cells are specialized antigen-presenting cells that play a pivotal role in the initiation and regulation of the immune response. They are found in tissues that are in contact with the external environment, such as the skin and the linings of the nose, lungs, stomach, and intestines. Dendritic cells capture antigens from pathogens or cancer cells and process them to present on their surface to T cells, thereby activating the adaptive immune response. They are also involved in maintaining tolerance to self-antigens, preventing autoimmune diseases. The ability of dendritic cells to bridge the innate and adaptive immune systems makes them critical for effective immunity.",
      analysis: "Normal dendritic cell levels indicate a well-balanced immune system capable of effectively detecting and responding to pathogens. Adequate dendritic cell function ensures that the adaptive immune response is properly activated, leading to the production of targeted antibodies and memory cells that provide long-term immunity. Normal levels also help maintain immune tolerance, reducing the risk of autoimmune diseases. Maintaining healthy dendritic cell levels is crucial for overall immune competence and for the body's ability to respond to new infections.",
      recommendations: "Maintaining normal dendritic cell levels involves supporting overall immune health through a balanced diet, regular exercise, and adequate sleep. Stress management techniques, such as yoga or meditation, can also help maintain a healthy immune system. Avoiding smoking and limiting alcohol consumption is important, as these can negatively impact dendritic cell function. Regular health check-ups and vaccinations are also essential for preventing infections that could challenge the immune system.",
    },
    {
      name: "Natural Killer Cells",
      icon: "cell_nk",
      value: "5.90%",
      num: 5.9,
      min: 0.0,
      max: 6.5,
      status: "Normal",
      description: "Natural Killer (NK) cells are a type of cytotoxic lymphocyte critical to the innate immune system. Unlike other lymphocytes that require prior exposure to an antigen to respond, NK cells can recognize and kill stressed cells, such as those infected by viruses or transformed into tumor cells, without prior sensitization. NK cells express activating and inhibitory receptors that allow them to distinguish between healthy cells and those that need to be eliminated. They are also involved in producing cytokines, particularly interferon-gamma, which enhances the immune response by activating other immune cells. NK cells play a crucial role in early defense against infections and cancer.",
      analysis: "Normal NK cell levels are essential for a strong innate immune response, providing rapid defense against infections and malignancies. A balanced NK cell population ensures that the body can efficiently eliminate infected or cancerous cells before they cause significant damage. Normal NK cell function also involves modulating the activity of other immune cells, helping to coordinate a broader immune response. Maintaining normal NK cell levels is crucial for overall immune competence and for the body's ability to respond effectively to early threats.",
      recommendations: "Maintaining normal NK cell levels involves supporting overall immune health through a balanced lifestyle. Regular physical activity, a nutrient-rich diet, and adequate sleep are essential for sustaining healthy NK cell function. Managing stress through mindfulness, yoga, or other relaxation techniques can help prevent immune suppression and maintain normal NK cell activity. Avoiding smoking and excessive alcohol consumption is also important, as these can negatively impact immune function. Regular health check-ups and monitoring of immune function can help ensure that NK cell levels remain within the normal range.",
    },
    {
      name: "Neutrophils",
      icon: "cell_neut",
      value: "34.90%",
      num: 34.9,
      min: 9.7,
      max: 83.6,
      status: "Normal",
      description: "Neutrophils are the most abundant type of white blood cells and are a key component of the body's first line of defense against infections. They are produced in the bone marrow and are rapidly deployed to sites of infection or injury, where they engulf and destroy pathogens through a process known as phagocytosis. Neutrophils also release enzymes and reactive oxygen species that kill microbes, but these substances can also cause tissue damage if not carefully regulated. Neutrophils have a short lifespan and are continuously replenished by the bone marrow. Their rapid response to infection makes them a crucial part of the innate immune system.",
      analysis: "Normal neutrophil levels are essential for a robust and effective immune response to infections and injuries. A normal neutrophil count ensures that the body can quickly respond to and eliminate pathogens, preventing the spread of infection and promoting healing. Neutrophils also play a role in modulating inflammation, helping to prevent excessive tissue damage during immune responses. Maintaining normal neutrophil levels is crucial for overall health and for the body's ability to defend against common infections and injuries.",
      recommendations: "Maintaining normal neutrophil levels involves supporting overall immune health through a balanced diet, regular exercise, and adequate sleep. Stress management techniques, such as mindfulness or meditation, can also help maintain a healthy immune system. Avoiding smoking and limiting alcohol consumption can further support immune function. Regular health check-ups and monitoring of immune function can help detect any changes in neutrophil levels early, allowing for prompt intervention if needed.",
    },
    {
      name: "Basophils",
      icon: "cell_baso",
      value: "5.86%",
      num: 5.86,
      min: 0.0,
      max: 11.6,
      status: "Normal",
      description: "Basophils are a type of granulocyte, a white blood cell with granules containing histamine and other mediators involved in inflammatory responses and allergic reactions. Although they are the least abundant of the granulocytes, basophils play a crucial role in the body's defense against parasites and in hypersensitivity reactions, such as allergies and asthma. When activated, basophils release histamine, which contributes to the symptoms of allergic reactions, including vasodilation, increased vascular permeability, and bronchoconstriction. Basophils also produce cytokines that help regulate the immune response and attract other immune cells to sites of infection or injury.",
      analysis: "Normal basophil levels indicate a well-regulated immune system capable of responding appropriately to allergens and parasites. A balanced basophil count ensures that the body can mount an effective defense against certain infections while also managing allergic reactions in a controlled manner. Normal basophil levels suggest that the immune system is functioning optimally, with the ability to respond to challenges without causing excessive inflammation or allergic symptoms. Maintaining normal basophil levels is important for overall immune health, particularly in individuals with a history of allergies or asthma.",
      recommendations: "Maintaining normal basophil levels involves supporting overall immune health through a balanced diet, regular exercise, and adequate sleep. Stress management techniques, such as mindfulness or meditation, can also help maintain a healthy immune system. Avoiding known allergens and managing allergic conditions with appropriate medications, such as antihistamines, can help prevent fluctuations in basophil levels. Regular health check-ups and monitoring of immune function can help detect any changes in basophil levels early, allowing for prompt intervention if needed.",
    },
    {
      name: "Plasmablasts",
      icon: "cell_plasma",
      value: "0.00%",
      num: 0.0,
      min: 0.0,
      max: 0.1,
      status: "Normal",
      description: "Plasmablasts are short-lived, proliferating B cells that differentiate into plasma cells capable of producing large quantities of antibodies. They represent an early stage of B cell differentiation, emerging shortly after B cells are activated by antigen exposure. Plasmablasts are typically found in the blood during an active immune response and migrate to sites such as the bone marrow or lymphoid tissues, where they mature into plasma cells. Plasma cells are responsible for long-term antibody production, essential for sustained immunity and protection against infections. The presence of plasmablasts in the blood is usually a marker of an ongoing immune response, such as in infections, vaccinations, or autoimmune diseases.",
      analysis: "Normal plasmablast levels are indicative of a healthy immune response, with the body actively producing antibodies to defend against infections and other challenges. A normal plasmablast count suggests that the immune system is capable of mounting a rapid and effective response to new antigens, while also maintaining a pool of memory cells for long-term immunity. Normal levels are associated with a balanced immune system that can respond to infections, vaccinations, and other immune challenges effectively, without causing excessive inflammation or autoimmunity. Maintaining normal plasmablast levels is essential for ongoing immune competence and protection against disease.",
      recommendations: "Maintaining normal plasmablast levels involves supporting overall immune health through a balanced lifestyle. Regular physical activity, a nutrient-rich diet, and adequate sleep are essential for sustaining healthy plasmablast function and antibody production. Stress management techniques, such as mindfulness, yoga, or meditation, can help prevent immune suppression and maintain normal plasmablast activity. Avoiding smoking and excessive alcohol consumption is also important, as these can negatively impact immune function. Regular health check-ups and vaccinations are crucial for ensuring that the immune system remains capable of responding to challenges.",
    },
  ],
};

export const transcriptomeData: DataPair<TranscriptomeReport> = { real: report, demo: report };
