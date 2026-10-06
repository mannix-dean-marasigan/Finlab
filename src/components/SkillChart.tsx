import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { Skill } from '@/types/domain';
import { Progress } from './ui/misc';
import { fmtScore } from '@/lib/format';

export interface SkillValue {
  skill_id: string;
  name: string;
  score: number;
  weight: number;
  evidence_count?: number;
}

export function mergeSkills(skills: Skill[], scores: { skill_id: string; score: number; evidence_count?: number }[]): SkillValue[] {
  return skills.map((s) => {
    const v = scores.find((x) => x.skill_id === s.id);
    return { skill_id: s.id, name: s.name, weight: Number(s.weight), score: Number(v?.score ?? 0), evidence_count: v?.evidence_count ?? 0 };
  });
}

export function SkillRadar({ data, height = 260 }: { data: SkillValue[]; height?: number }) {
  const chartData = data.map((d) => ({ skill: d.name.replace('Investment ', 'Inv. ').replace('Technical ', 'Tech. '), score: d.score }));
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={chartData} outerRadius="72%">
          <PolarGrid stroke="#2a3443" />
          <PolarAngleAxis dataKey="skill" tick={{ fill: '#8b98a8', fontSize: 11 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Tooltip
            contentStyle={{ background: '#11161e', border: '1px solid #2a3443', borderRadius: 6, fontSize: 12 }}
            formatter={(v) => [fmtScore(Number(v)), 'Score']}
          />
          <Radar dataKey="score" stroke="#f5a524" fill="#f5a524" fillOpacity={0.18} strokeWidth={2} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SkillBars({ data }: { data: SkillValue[] }) {
  return (
    <div className="space-y-3">
      {data.map((s) => (
        <div key={s.skill_id}>
          <div className="flex items-center justify-between text-sm">
            <span className="text-fg/90">
              {s.name} <span className="text-xs text-fg-subtle">· {s.weight}%</span>
            </span>
            <span className="font-mono text-xs tabular text-fg-muted">
              {fmtScore(s.score)}
              {s.evidence_count !== undefined && <span className="ml-2 text-fg-subtle">{s.evidence_count} ev.</span>}
            </span>
          </div>
          <Progress value={s.score} className="mt-1.5" />
        </div>
      ))}
    </div>
  );
}
