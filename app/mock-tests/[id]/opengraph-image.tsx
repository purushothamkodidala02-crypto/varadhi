import { ImageResponse } from "next/og";
import { createPublicClient } from "@/lib/supabase/public";

export const alt = "Varadhi Prep competitive exam mock test";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type ShareDetails = {
  examName: string;
  paperLabel: string;
  mockLabel: string;
  durationLabel: string;
  stateLabel: string;
};

async function getShareDetails(id: string): Promise<ShareDetails> {
  const fallback: ShareDetails = {
    examName: "Competitive Exam Mock Test",
    paperLabel: "Exam Practice",
    mockLabel: "Free Mock Test",
    durationLabel: "Practice with purpose",
    stateLabel: "VARADHI PREP",
  };

  try {
    const supabase = createPublicClient();
    const { data: test } = await supabase
      .from("mock_tests")
      .select("paper_id, series_number, title, duration_minutes")
      .eq("id", id)
      .eq("status", "published")
      .eq("access_type", "free")
      .maybeSingle();

    if (!test) return fallback;

    const details: ShareDetails = {
      ...fallback,
      mockLabel: `Mock Test ${String(Math.max(1, Number(test.series_number ?? 1))).padStart(2, "0")}`,
      durationLabel: `${test.duration_minutes} minutes · Free`,
    };

    const { data: paper } = await supabase
      .from("papers")
      .select("exam_group_id, name, display_order")
      .eq("id", test.paper_id)
      .maybeSingle();
    if (!paper) return { ...details, examName: test.title };

    details.paperLabel = `Paper ${Math.max(1, Number(paper.display_order ?? 1))} · ${paper.name}`;
    const { data: exam } = await supabase
      .from("exam_groups")
      .select("exam_id, name")
      .eq("id", paper.exam_group_id)
      .maybeSingle();
    if (!exam) return details;

    details.examName = exam.name;
    const { data: category } = await supabase
      .from("exams")
      .select("state_id")
      .eq("id", exam.exam_id)
      .maybeSingle();
    if (!category?.state_id) return details;

    const { data: state } = await supabase
      .from("exam_states")
      .select("code")
      .eq("id", category.state_id)
      .maybeSingle();
    details.stateLabel = state?.code ? `${state.code} EXAM PRACTICE` : fallback.stateLabel;
    return details;
  } catch {
    return fallback;
  }
}

export default async function MockTestOpenGraphImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const details = await getShareDetails(id);

  return new ImageResponse(
    <div
      style={{
        alignItems: "stretch",
        background: "linear-gradient(135deg, #020617 0%, #0f172a 62%, #0f766e 100%)",
        color: "white",
        display: "flex",
        height: "100%",
        padding: "64px 72px",
        width: "100%",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
        <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
          <div style={{ alignItems: "center", display: "flex" }}>
            <div
              style={{
                alignItems: "center",
                background: "#5eead4",
                borderRadius: 18,
                color: "#020617",
                display: "flex",
                fontSize: 40,
                fontWeight: 900,
                height: 68,
                justifyContent: "center",
                width: 68,
              }}
            >
              V
            </div>
            <div style={{ display: "flex", flexDirection: "column", marginLeft: 20 }}>
              <div style={{ fontSize: 34, fontWeight: 900 }}>Varadhi Prep</div>
              <div style={{ color: "#5eead4", fontSize: 14, fontWeight: 800, letterSpacing: 3, marginTop: 4 }}>
                SMART MOCK TESTS FOR CAREER GROWTH
              </div>
            </div>
          </div>
          <div style={{ color: "#99f6e4", display: "flex", fontSize: 18, fontWeight: 800, letterSpacing: 2 }}>
            {details.stateLabel}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: 78 }}>
          <div style={{ color: "#5eead4", fontSize: 22, fontWeight: 900, letterSpacing: 2.5 }}>
            {details.paperLabel.toUpperCase()}
          </div>
          <div style={{ fontSize: 68, fontWeight: 900, lineHeight: 1.08, marginTop: 18, maxWidth: 980 }}>
            {details.examName}
          </div>
          <div style={{ alignItems: "center", display: "flex", marginTop: 32 }}>
            <div style={{ background: "#5eead4", borderRadius: 14, color: "#020617", display: "flex", fontSize: 27, fontWeight: 900, padding: "14px 22px" }}>
              {details.mockLabel}
            </div>
            <div style={{ color: "#cbd5e1", display: "flex", fontSize: 23, fontWeight: 700, marginLeft: 22 }}>
              {details.durationLabel}
            </div>
          </div>
        </div>

        <div style={{ color: "#99f6e4", display: "flex", fontSize: 22, fontWeight: 900, marginTop: "auto" }}>
          varadhiprep.in
        </div>
      </div>
    </div>,
    size,
  );
}
