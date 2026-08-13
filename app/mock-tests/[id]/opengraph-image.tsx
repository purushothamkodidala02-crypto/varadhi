import { ImageResponse } from "next/og";
import { mockTestLabel } from "@/lib/exam-catalog";
import { buildPaperDisplayMap, type OrderedPaper } from "@/lib/papers";
import { createPublicClient } from "@/lib/supabase/public";

export const alt = "Varadhi Prep competitive exam mock test";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function MockTestOpenGraphImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createPublicClient();

  const { data: test } = await supabase
    .from("mock_tests")
    .select("id, paper_id, series_number, title, duration_minutes")
    .eq("id", id)
    .eq("status", "published")
    .eq("access_type", "free")
    .maybeSingle();

  let examName = "Competitive Exam";
  let paperLabel = "Mock Test";
  let stateLabel = "EXAM PRACTICE";
  let mockLabel = test?.title ?? "Free Mock Test";

  if (test) {
    mockLabel = mockTestLabel(Number(test.series_number ?? 1));
    const { data: paper } = await supabase
      .from("papers")
      .select("id, exam_group_id, specialization_id, name, display_order")
      .eq("id", test.paper_id)
      .maybeSingle();

    if (paper) {
      const [{ data: exam }, { data: siblingPapers }] = await Promise.all([
        supabase
          .from("exam_groups")
          .select("id, exam_id, name")
          .eq("id", paper.exam_group_id)
          .maybeSingle(),
        supabase
          .from("papers")
          .select("id, exam_group_id, specialization_id, name, display_order")
          .eq("exam_group_id", paper.exam_group_id)
          .eq("is_active", true),
      ]);

      examName = exam?.name ?? examName;
      paperLabel =
        buildPaperDisplayMap((siblingPapers ?? []) as OrderedPaper[]).get(paper.id)
          ?.shortLabel ?? paper.name;

      if (exam) {
        const { data: category } = await supabase
          .from("exams")
          .select("id, state_id")
          .eq("id", exam.exam_id)
          .maybeSingle();
        if (category?.state_id) {
          const { data: state } = await supabase
            .from("exam_states")
            .select("code")
            .eq("id", category.state_id)
            .maybeSingle();
          stateLabel = state?.code ? `${state.code} EXAM PRACTICE` : stateLabel;
        }
      }
    }
  }

  const title = `${examName} ${paperLabel}`;
  const duration = test?.duration_minutes
    ? `${test.duration_minutes} MINUTES`
    : "FREE MOCK TEST";

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        background: "#f6faf9",
        color: "#020617",
        padding: "62px 70px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          right: -90,
          top: -120,
          width: 430,
          height: 430,
          borderRadius: 999,
          background: "#ccfbf1",
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 70,
          bottom: -180,
          width: 390,
          height: 390,
          borderRadius: 999,
          background: "#fde68a",
          opacity: 0.55,
          display: "flex",
        }}
      />

      <div style={{ display: "flex", flexDirection: "column", width: "100%", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                background: "#020617",
                color: "#5eead4",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 42,
                fontWeight: 900,
              }}
            >
              V
            </div>
            <div style={{ display: "flex", flexDirection: "column", marginLeft: 20 }}>
              <div style={{ fontSize: 34, fontWeight: 900 }}>Varadhi Prep</div>
              <div style={{ color: "#0f766e", fontSize: 15, fontWeight: 800, letterSpacing: 3.5, marginTop: 5 }}>
                SMART MOCK TESTS FOR CAREER GROWTH
              </div>
            </div>
          </div>
          <div
            style={{
              border: "2px solid #99f6e4",
              borderRadius: 999,
              color: "#0f766e",
              display: "flex",
              fontSize: 16,
              fontWeight: 900,
              letterSpacing: 2,
              padding: "12px 20px",
            }}
          >
            {stateLabel}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: 72, maxWidth: 920 }}>
          <div style={{ color: "#0f766e", fontSize: 22, fontWeight: 900, letterSpacing: 3 }}>
            {paperLabel.toUpperCase()} · {duration}
          </div>
          <div style={{ fontSize: 66, fontWeight: 900, letterSpacing: -2.4, lineHeight: 1.08, marginTop: 18 }}>
            {title}
          </div>
          <div style={{ display: "flex", alignItems: "center", marginTop: 30 }}>
            <div
              style={{
                background: "#020617",
                borderRadius: 16,
                color: "white",
                display: "flex",
                fontSize: 27,
                fontWeight: 900,
                padding: "15px 24px",
              }}
            >
              {mockLabel}
            </div>
            <div style={{ color: "#475569", display: "flex", fontSize: 22, fontWeight: 700, marginLeft: 22 }}>
              Free · English + Telugu
            </div>
          </div>
        </div>

        <div style={{ color: "#0f766e", display: "flex", fontSize: 22, fontWeight: 900, marginTop: "auto" }}>
          varadhiprep.in
        </div>
      </div>
    </div>,
    size,
  );
}
