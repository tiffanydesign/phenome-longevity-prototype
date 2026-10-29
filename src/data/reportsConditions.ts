import type { DataPair } from "@/lib/data";

/** Health Conditions findings (capture: genetic_conditions/top, scroll_1…4, card_2). */
export interface ConditionFinding {
  tag: string;
  name: string;
  gene: string;
  variant: string;
  inheritance: string;
  rsid: string;
  zygosity: string;
  /** empty in the capture (label shown with no value) */
  pathogenicity: string;
  sections: { title: string; body: string }[];
}

const aos: ConditionFinding = {
  tag: "MONITOR CLOSELY",
  name: "Aneurysm-osteoarthritis syndrome",
  gene: "SMAD3",
  variant: "NM_005902.4:c.533-13_533-10del",
  inheritance: "Autosomal dominant",
  rsid: "rs752716057",
  zygosity: "Heterozygous",
  pathogenicity: "",
  sections: [
    { title: "Risk Factors", body: "Aneurysm-osteoarthritis syndrome is a hereditary condition often characterized by the co-occurrence of aneurysms and osteoarthritis. While the exact cause of this syndrome is not fully understood, several risk factors contribute to its development and progression. Inherited genetic factors play a significant role, with certain gene mutations increasing the likelihood of aneurysm formation. Age is another crucial factor, as the risk of aneurysms and osteoarthritis tends to rise with advanced age. Gender also influences susceptibility, with men being more prone to aneurysms than women. Lifestyle factors, such as smoking and alcohol consumption, can exacerbate the risk of aneurysms and osteoarthritis. Poor diet, obesity, and lack of exercise may also contribute to the development of these conditions. Additionally, comorbidities like high blood pressure, high cholesterol, and diabetes can increase the likelihood of aneurysms and osteoarthritis. Environmental factors, such as exposure to toxins or pollutants, may also play a role in the development of aneurysm-osteoarthritis syndrome. Understanding these risk factors is crucial for early detection, prevention, and management of aneurysm-osteoarthritis syndrome." },
    { title: "Lifestyle & Prevention", body: "Managing Aneurysm-osteoarthritis syndrome requires a holistic lifestyle approach for effective prevention and symptom management. A crucial aspect of managing this condition involves regular medical check-ups and monitoring to detect any changes or complications early. Exercise and physical activity should be tailored to the individual's abilities and limitations, with guidance from healthcare professionals to avoid injury. Maintaining a healthy diet, rich in nutrients and low in inflammatory foods, can help alleviate symptoms and improve overall health. Additionally, avoiding smoking and limiting alcohol consumption are essential lifestyle modifications that can significantly reduce the risk of complications. Furthermore, stress management techniques, such as meditation, yoga, and mindfulness, can help improve symptoms and enhance quality of life. Genetic counseling may also be beneficial in understanding the risk of passing on the condition to family members and developing personalized prevention strategies. Overall, a comprehensive lifestyle approach, in collaboration with healthcare professionals, is crucial for effective management and prevention of Aneurysm-osteoarthritis syndrome." },
    { title: "Epidemiology", body: "Aneurysm-osteoarthritis syndrome (AOS) is a rare genetic disorder characterized by the development of aneurysms in various parts of the body, particularly in the aorta and cerebral arteries, as well as osteoarthritis. With an estimated prevalence of around 1-3 in a million individuals worldwide, AOS exhibits autosomal dominant inheritance, although sporadic cases have also been reported. The age of onset and severity of symptoms can vary widely, even among family members with the same genetic mutation. Both men and women can be affected, and the disorder has been reported in individuals of diverse ethnic backgrounds. The combination of aneurysms and osteoarthritis in AOS can lead to a range of clinical manifestations, including pain, mobility limitations, and potential life-threatening complications such as rupture of aneurysms or dissection. As a result, early and accurate diagnosis and ongoing management are crucial for individuals with AOS." },
  ],
};

const dcm: ConditionFinding = {
  tag: "MONITOR CLOSELY",
  name: "Dilated cardiomyopathy 1G",
  gene: "TTN",
  variant: "NM_001267550.2:c.61328A>G",
  inheritance: "Autosomal dominant",
  rsid: "rs2049953102",
  zygosity: "Heterozygous",
  pathogenicity: "",
  // TODO(fidelity): only the top of card 2 was captured; its Lifestyle & Prevention and
  // Epidemiology sections are unknown and omitted.
  sections: [{ title: "Risk Factors", body: "Dilated cardiomyopathy, a disease characterized by the heart's main pumping chamber becoming weakened and enlarged, has various risk factors that contribute to its development. Genetic predisposition plays a significant role, with certain genetic mutations and familial history increasing the likelihood of developing dilated cardiomyopathy. Additionally, long-standing high blood pressure can cause the heart to work harder, potentially leading to the weakening and enlargement of the heart muscle. Similarly, inflammatory diseases, such as viral infections or autoimmune disorders, can cause inflammation in the heart muscle and contribute to its weakening. Certain toxins, like alcohol and chemotherapy drugs, can also damage the heart muscle and lead to its enlargement. Moreover, diseases that affect the heart's electrical system, such as myocarditis or long QT syndrome, can increase the risk of developing dilated cardiomyopathy. Lastly, factors such as age, obesity, and diabetes can exacerbate the risk of developing dilated cardiomyopathy, particularly in individuals with other underlying risk factors." }],
};

export const conditionsData: DataPair<ConditionFinding[]> = { real: [aos, dcm], demo: [aos, dcm] };
