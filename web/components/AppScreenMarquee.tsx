import { AppScreen } from "@/components/AppScreen";
import { getAppScreen, type AppScreenId } from "@/lib/app-screens";

export function AppScreenMarquee({
  ids,
}: {
  ids: AppScreenId[];
}) {
  return (
    <div className="app-screen-marquee relative mt-6 pb-8">
      <div className="app-screen-marquee-fade pointer-events-none absolute inset-y-0 left-0 z-10 w-10 sm:w-16" />
      <div className="app-screen-marquee-fade-right pointer-events-none absolute inset-y-0 right-0 z-10 w-10 sm:w-16" />
      <div className="app-screen-marquee-viewport overflow-hidden py-1">
        <div className="app-screen-marquee-track flex w-max">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex gap-4 pr-4 sm:gap-5 sm:pr-5">
              {ids.map((id) => (
                <AppScreen
                  key={`${copy}-${id}`}
                  screen={getAppScreen(id)}
                  size="marquee"
                  decorative={copy === 1}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
