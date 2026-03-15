import Step2BaseColorInput from '../Step2BaseColorInput';

type Props = {
  onPrev: () => void;
  onNext: () => void;
};

export default function Step2KeyColorsScreen({ onPrev, onNext }: Props) {
  return (
    <div className="flex w-full flex-col overflow-hidden bg-white items-center pt-[80px]">
      <div className="flex flex-col w-[1080px] max-w-full">
        <div className="flex w-full items-baseline justify-between pb-2">
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
          <p className="text-[#808090]" style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, lineHeight: '25.2px' }}>
           This step allows you to create a few key colors that will form the foundation of your design system. You can choose between automatic and manual modes, and define the primary, secondary, tertiary, and neutral colors that represent your product or brand. These colors and settings can be changed at any time later.
          </p>
        </div>
      </div>

      <div className="flex w-[1080px] max-w-full flex-1 min-h-0 items-stretch pt-[54px] pb-[54px]">
        <div className="grid w-full grid-cols-12 gap-6 min-h-0">


          <section className="col-span-12 min-h-0 w-[800px] mx-auto">
            <div className="h-full bg-white">
              <div>
                <Step2BaseColorInput introStep={0} />
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

