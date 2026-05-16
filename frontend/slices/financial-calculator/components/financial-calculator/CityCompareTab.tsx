"use client";

import { useMemo } from "react";
import { MapPin, Info } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Label } from "@/shared/components/ui/label";
import {
  ResponsiveSelect as Select,
  ResponsiveSelectContent as SelectContent,
  ResponsiveSelectItem as SelectItem,
  ResponsiveSelectTrigger as SelectTrigger,
} from "@/shared/components/ui/responsive-select";
import {
  ResponsiveTooltip as HelpTooltip,
  ResponsiveTooltipContent,
  ResponsiveTooltipTrigger,
} from "@/shared/components/ui/responsive-tooltip";
import { cn } from "@/shared/lib/utils";
import { indonesianCityCostOfLiving } from "@/shared/data/indonesianData";
import { useChartColors } from "../../hooks/useChartColors";

interface Props {
  selectedCity: string;
  setSelectedCity: (v: string) => void;
  compareCity: string;
  setCompareCity: (v: string) => void;
}

const getCityData = (cityName: string) =>
  indonesianCityCostOfLiving.find((c) => c.name === cityName) ||
  indonesianCityCostOfLiving[0];

export function CityCompareTab({
  selectedCity, setSelectedCity, compareCity, setCompareCity,
}: Props) {
  const chartColors = useChartColors();

  const cityComparisonData = useMemo(() => {
    const city1 = getCityData(selectedCity);
    const city2 = getCityData(compareCity);
    return [
      { name: "Indeks Biaya", [selectedCity]: city1.costIndex, [compareCity]: city2.costIndex },
      { name: "Indeks Sewa", [selectedCity]: city1.rentIndex, [compareCity]: city2.rentIndex },
      { name: "Belanja", [selectedCity]: city1.groceriesIndex, [compareCity]: city2.groceriesIndex },
      { name: "Restoran", [selectedCity]: city1.restaurantIndex, [compareCity]: city2.restaurantIndex },
    ];
  }, [selectedCity, compareCity]);

  return (
    <>
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg">Pilih Kota untuk Dibandingkan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="mb-2 block">Kota Anda</Label>
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger />
                <SelectContent>
                  {indonesianCityCostOfLiving.map((city) => (
                    <SelectItem key={city.name} value={city.name}>
                      {city.name}, {city.country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block">Bandingkan Dengan</Label>
              <Select value={compareCity} onValueChange={setCompareCity}>
                <SelectTrigger />
                <SelectContent>
                  {indonesianCityCostOfLiving.map((city) => (
                    <SelectItem key={city.name} value={city.name}>
                      {city.name}, {city.country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              Perbandingan Biaya
              <HelpTooltip>
                <ResponsiveTooltipTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
                    aria-label="Apa itu indeks biaya?"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </ResponsiveTooltipTrigger>
                <ResponsiveTooltipContent>
                  <p className="font-medium">Skor indeks biaya</p>
                  <p className="text-muted-foreground">
                    Jakarta = 100 (baseline). Skor 280 artinya 2,8× lebih
                    mahal dari Jakarta. Angka relatif — bukan rupiah.
                  </p>
                </ResponsiveTooltipContent>
              </HelpTooltip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={cityComparisonData}
                  margin={{ top: 12, right: 12, left: 4, bottom: 4 }}
                  barCategoryGap="20%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridLine} vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke={chartColors.tickText}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke={chartColors.tickText}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    width={36}
                  />
                  <Tooltip cursor={{ fill: chartColors.cursorFill }} />
                  <Legend
                    wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                    iconType="circle"
                  />
                  <Bar dataKey={selectedCity} fill={chartColors.compareA} radius={[4, 4, 0, 0]} />
                  <Bar dataKey={compareCity} fill={chartColors.compareB} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Detail Kota</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[selectedCity, compareCity].map((cityName, index) => {
                const city = getCityData(cityName);
                return (
                  <div
                    key={cityName}
                    className={cn(
                      "p-4 rounded-xl",
                      index === 0 ? "bg-brand-muted" : "bg-accent/50",
                    )}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        index === 0 ? "bg-brand" : "bg-brand-to",
                      )}>
                        <MapPin className="w-5 h-5 text-brand-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{city.name}</p>
                        <p className="text-sm text-muted-foreground">{city.country}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Indeks Biaya</p>
                        <p className="font-semibold text-brand">{city.costIndex}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Indeks Sewa</p>
                        <p className="font-semibold text-brand">{city.rentIndex}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
