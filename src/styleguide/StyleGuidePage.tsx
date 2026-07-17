import { useState } from 'react'
import { Button } from '../components/Button'
import { Chip } from '../components/Chip'
import { TaskCard } from '../components/TaskCard'
import { EnergyBar } from '../components/EnergyBar'
import { OptionRow } from '../components/OptionRow'
import { TextInput } from '../components/TextInput'
import { NorthStarBadge } from '../components/NorthStarBadge'
import { BonusCard } from '../components/BonusCard'
import { TimerDisplay } from '../components/TimerDisplay'
import styles from './StyleGuidePage.module.css'

// 살아있는 디자인 시스템 갤러리 (dev/QA 전용 · 앱 내비게이션에서 링크되지 않음).
// 목적: 문서(docs/design-system/*)만으론 "어떻게 생겼는지" 가늠할 수 없는 한계를 메운다.
// 규약이 실제로 렌더되는 형태를 320/375/768에서 눈으로/스냅샷으로 검증한다.
// 상세: docs/design-system/README-gallery.md

type Swatch = { name: string; varName: string; note?: string }

const SURFACES: Swatch[] = [
  { name: 'surface.page', varName: '--surface-page', note: '최하단 종이' },
  { name: 'surface.base', varName: '--surface-base', note: '기본 화면/카드' },
  { name: 'surface.raised', varName: '--surface-raised', note: '입력/올라온 카드' },
  { name: 'surface.float', varName: '--surface-float', note: '팝오버' },
  { name: 'surface.subtle', varName: '--surface-subtle', note: '잔잔한 패널' },
]

const INKS: Swatch[] = [
  { name: 'text.strong', varName: '--text-strong' },
  { name: 'text.primary', varName: '--text-primary' },
  { name: 'text.secondary', varName: '--text-secondary' },
  { name: 'text.label', varName: '--text-label' },
  { name: 'text.quiet', varName: '--text-quiet' },
]

const SIGNAL: Swatch[] = [
  { name: 'action', varName: '--action', note: 'CTA — 즉시성의 순간에만' },
  { name: 'evidence.fill', varName: '--evidence-fill', note: '에너지 칸(신성불가침)' },
  { name: 'chip.bg', varName: '--chip-bg', note: '동사칩' },
  { name: 'bonus.bg', varName: '--bonus-bg', note: '적중 가산' },
]

const SPACES = [1, 2, 3, 4, 5, 6, 7, 8] as const
const RADII = ['xs', 'md', 'lg', 'xl', '2xl', 'pill'] as const
const TYPE_SCALE: { token: string; role: string }[] = [
  { token: '--font-size-2xl', role: '주 (카드 제목) · serif' },
  { token: '--font-size-xl', role: '주 (제목 소)' },
  { token: '--font-size-lg', role: '보조 (버튼·입력)' },
  { token: '--font-size-md', role: '보조 (본문)' },
  { token: '--font-size-sm', role: '라벨 (메타)' },
  { token: '--font-size-xs', role: '라벨 (힌트)' },
]
const ELEVATIONS = ['inner', 'soft', 'card', 'popover', 'cta', 'sheet'] as const

function Section({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section className={styles.section} aria-labelledby={id}>
      <h2 id={id} className={styles.sectionTitle}>
        {title}
      </h2>
      {children}
    </section>
  )
}

function SwatchGrid({ items }: { items: Swatch[] }) {
  return (
    <div className={styles.swatchGrid}>
      {items.map((s) => (
        <div key={s.varName} className={styles.swatch}>
          <span className={styles.swatchChip} style={{ background: `var(${s.varName})` }} />
          <span className={styles.swatchName}>{s.name}</span>
          {s.note && <span className={styles.swatchNote}>{s.note}</span>}
        </div>
      ))}
    </div>
  )
}

function FoundationsSections() {
  return (
    <>
      <Section id="sg-color" title="Foundations · 색">
        <h3 className={styles.subhead}>surface</h3>
        <SwatchGrid items={SURFACES} />
        <h3 className={styles.subhead}>text</h3>
        <SwatchGrid items={INKS} />
        <h3 className={styles.subhead}>signal (의미색)</h3>
        <SwatchGrid items={SIGNAL} />
      </Section>

      <Section id="sg-space" title="Foundations · 여백 (SP)">
        <div className={styles.spaceStack}>
          {SPACES.map((n) => (
            <div key={n} className={styles.spaceRow}>
              <span className={styles.spaceLabel}>space.{n}</span>
              <span className={styles.spaceBar} style={{ width: `var(--space-${n})` }} />
            </div>
          ))}
        </div>
      </Section>

      <Section id="sg-type" title="Foundations · 타이포 (TY ≤3단계)">
        <div className={styles.typeStack}>
          {TYPE_SCALE.map((t) => (
            <div key={t.token} className={styles.typeRow}>
              <span
                className={styles.typeSample}
                style={{
                  fontSize: `var(${t.token})`,
                  fontFamily:
                    t.token === '--font-size-2xl' ? 'var(--font-family-serif)' : undefined,
                }}
              >
                오늘 15분, 나도 해냈다
              </span>
              <span className={styles.typeMeta}>{t.role}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section id="sg-radius" title="Foundations · 라운드 & 깊이 (EL)">
        <div className={styles.chipRowWrap}>
          {RADII.map((r) => (
            <span
              key={r}
              className={styles.radiusBox}
              style={{ borderRadius: `var(--radius-${r})` }}
            >
              {r}
            </span>
          ))}
        </div>
        <div className={styles.elevRow}>
          {ELEVATIONS.map((e, i) => (
            <div key={e} className={styles.elevBox} style={{ boxShadow: `var(--elevation-${e})` }}>
              <span className={styles.elevRank}>{i + 1}</span>
              {e}
            </div>
          ))}
        </div>
      </Section>
    </>
  )
}

function ComponentCatalog() {
  const [draft, setDraft] = useState('')
  const [pick, setPick] = useState<string | null>(null)

  return (
    <Section id="sg-components" title="컴포넌트 카탈로그 (C)">
      <div className={styles.specimenGrid}>
        <div className={styles.specimen}>
          <p className={styles.specimenLabel}>C-01 Button</p>
          <div className={styles.chipRowWrap}>
            <Button variant="primary">이 블록 시작하기</Button>
            <Button variant="secondary">오늘은 가볍게 갈까요</Button>
            <Button variant="primary" disabled>
              다음
            </Button>
          </div>
        </div>

        <div className={styles.specimen}>
          <p className={styles.specimenLabel}>C-02 Chip</p>
          <div className={styles.chipRowWrap}>
            <Chip variant="default">확인하기</Chip>
            <Chip variant="selected">정리하기</Chip>
          </div>
        </div>

        <div className={styles.specimen}>
          <p className={styles.specimenLabel}>C-03 TaskCard</p>
          <TaskCard title="발표 자료 만들기">
            <p className={styles.muted}>다음 조각: 목차 확인하기</p>
            <Button variant="primary">이 블록 시작하기</Button>
          </TaskCard>
        </div>

        <div className={styles.specimen}>
          <p className={styles.specimenLabel}>C-04 EnergyBar (0 / 3 / 6)</p>
          <EnergyBar filledCount={0} />
          <EnergyBar filledCount={3} justFilledIndex={2} />
          <EnergyBar filledCount={6} />
        </div>

        <div className={styles.specimen}>
          <p className={styles.specimenLabel}>C-05 OptionRow</p>
          <OptionRow
            label="이번엔 잘 될 것 같아"
            selected={pick === 'a'}
            onSelect={() => setPick('a')}
          />
          <OptionRow label="잘 모르겠어" selected={pick === 'b'} onSelect={() => setPick('b')} />
        </div>

        <div className={styles.specimen}>
          <p className={styles.specimenLabel}>C-07 TextInput</p>
          <TextInput value={draft} onChange={setDraft} label="오늘 할 일" />
        </div>

        <div className={styles.specimen}>
          <p className={styles.specimenLabel}>C-08 TimerDisplay</p>
          <TimerDisplay label="목차 정리하기" remainingLabel="14:32" variant="running" />
        </div>

        <div className={styles.specimen}>
          <p className={styles.specimenLabel}>C-10 BonusCard (hit=true)</p>
          <BonusCard hit={true} />
          <p className={styles.muted}>hit=false → 렌더 없음(무표시)</p>
        </div>

        <div className={styles.specimen}>
          <p className={styles.specimenLabel}>C-11 NorthStarBadge</p>
          <NorthStarBadge northStar={{ aspiration: '작가 되기', obligation: '이력서 넣기' }} />
        </div>
      </div>
      <p className={styles.footnote}>
        C-06 BottomSheet(오버레이)·C-09 StateChip(회고 페이지 로컬, 의도적 격리)은 각 화면
        맥락에서만 검증한다.
      </p>
    </Section>
  )
}

function CompositionCompare() {
  return (
    <Section id="sg-composition" title="화면 구성 (CMP) · 바벨 공허 vs 프레임된 여백">
      <div className={styles.compareRow}>
        <figure className={styles.phone}>
          <figcaption className={styles.badBadge}>✗ 바벨 공허</figcaption>
          <div className={styles.phoneHeader}>헤더</div>
          <div className={styles.tinyCard}>123</div>
          <div className={styles.deadVoid}>정의되지 않은 공백</div>
          <div className={styles.invisibleAnchor}>· (보이지 않는 앵커)</div>
        </figure>

        <figure className={styles.phone}>
          <figcaption className={styles.goodBadge}>✓ 프레임된 여백</figcaption>
          <div className={styles.phoneHeader}>헤더</div>
          <div className={styles.focalBand}>
            <TaskCard title="발표 자료 만들기">
              <p className={styles.muted}>다음 조각: 목차 확인하기</p>
              <Button variant="primary">이 블록 시작하기</Button>
            </TaskCard>
          </div>
          <div className={styles.framedGap} />
          <div className={styles.anchor}>
            <Button variant="secondary">오늘은 가볍게 갈까요</Button>
            <EnergyBar filledCount={2} />
          </div>
        </figure>
      </div>
      <p className={styles.footnote}>
        CMP-3 초점 밴드(카드에 presence + 상단 여백) · CMP-4 공백 프레이밍 · CMP-5 앵커 가시성 보장.
        장식 추가 없이 비례·재배치만으로 해결(CMP-6).
      </p>
    </Section>
  )
}

export default function StyleGuidePage() {
  return (
    <main className={styles.page}>
      <header className={styles.masthead}>
        <p className={styles.kicker}>컴페이스 디자인 시스템</p>
        <h1 className={styles.h1}>살아있는 갤러리</h1>
        <p className={styles.lede}>
          규약(docs/design-system/*)이 실제로 어떻게 보이는지 확인하는 dev/QA 전용 화면. 앱
          내비게이션에서 링크되지 않는다.
        </p>
      </header>
      <FoundationsSections />
      <ComponentCatalog />
      <CompositionCompare />
    </main>
  )
}
