import BaseColorInput from '../BaseColorInput';

type Props = {
  onPrev: () => void;
  onNext: () => void;
};

export default function Step2KeyColorsScreen({ onPrev, onNext }: Props) {
  return (
    <div className="flex w-full flex-col overflow-hidden bg-white items-center pt-[80px]">
      <div className="flex flex-col w-[1080px] max-w-full">
        <div className="flex w-full items-center justify-between pb-2">
          <h1
            className="text-[#333]"
            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 24, lineHeight: '29.05px' }}
          >
            Step 2 . Key colors
          </h1>
          <div className="flex items-center w-[120px] h-[50px]">
            <img src="/logo-opencolor-s.svg" alt="OpenColor" style={{ width: '100%', height: 'auto' }} />
          </div>
        </div>

        <div className="w-full h-[2px] bg-[#404050]" />

        <div className="pt-3">
          <p className="text-[#808090]" style={{ fontFamily: 'Inter, sans-serif', fontSize: 18, lineHeight: '25.2px' }}>
            Select the primary brand colors for your project.
          </p>
        </div>
      </div>

      <div className="flex w-[1080px] max-w-full flex-1 min-h-0 items-stretch pt-6 pb-6">
        <div className="grid w-full grid-cols-12 gap-6 min-h-0">
          <section className="col-span-12 lg:col-span-4 min-h-0">
            <div className="rounded-2xl border border-[#E7E7EE] bg-white p-5 shadow-[0px_8px_24px_rgba(0,0,0,0.06)]">
              <h2 className="text-[16px] font-semibold text-[#333]">
                선택 가이드
              </h2>
              <ul className="mt-3 space-y-2 text-[14px] leading-[20px] text-[#666]">
                <li>- Primary: 대표 브랜드 컬러</li>
                <li>- Secondary: 보조/강조 컬러</li>
                <li>- Neutral: 배경/서피스 기반</li>
                <li>- Error: 경고/에러 상태</li>
              </ul>

              <div className="mt-4 rounded-xl bg-[#F7F7F9] p-4 text-[13px] leading-[18px] text-[#666]">
                팁: 대비가 낮으면 토큰 생성 후 텍스트 가독성이 떨어질 수 있어요.
              </div>
            </div>
          </section>

          <section className="col-span-12 lg:col-span-8 min-h-0">
            <div className="h-full rounded-2xl border border-[#E7E7EE] bg-white shadow-[0px_8px_24px_rgba(0,0,0,0.06)] overflow-hidden">
              <div className="border-b border-[#EFEFF4] px-5 py-4">
                <div className="text-[14px] font-semibold text-[#333]">
                  Key color picker
                </div>
                <div className="mt-1 text-[13px] text-[#808090]">
                  4개의 베이스 컬러를 설정하면 다음 단계에서 네이밍 룰을 정의합니다.
                </div>
              </div>
              <div>
                <BaseColorInput introStep={0} />
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="flex w-[1080px] max-w-full flex-col pb-[44px]">
        <div className="flex items-center w-full h-[50px]">
          <button
            className="flex items-center justify-center w-[120px] h-full rounded-[50px] border-[2px] border-[#404050] bg-white text-[#404050] transition-colors hover:bg-gray-50 cursor-pointer"
            onClick={onPrev}
          >
            <span className="font-semibold text-[18px] leading-[21.78px]">
              Prev.
            </span>
          </button>

          <div className="h-[2px] bg-[#404050] flex-1 mx-0" />

          <button
            className="flex items-center justify-center w-[120px] h-full rounded-[50px] transition-colors bg-[#404050] text-white hover:opacity-95 cursor-pointer"
            onClick={onNext}
          >
            <span className="font-semibold text-[18px] leading-[21.78px]">
              Next
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

