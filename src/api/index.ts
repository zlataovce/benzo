import { load } from "cheerio/lib/slim";

export interface FuelStation {
    name: string;
    street: string;
    city: string;
    postalCode: string;
    fuels: Fuel[];
}

export interface Fuel {
    name: string;
    price: string;
    lastUpdated: string | null;
}

export const searchStation = async (query: string, needed: number = 25): Promise<FuelStation[]> => {
    const res = await fetch(`https://www.mbenzin.cz/Ceny-benzinu-a-nafty/${query}`, {
        headers: {
            "User-Agent": "benzo",
        },
        cf: {
            cacheTtl: 60 * 30, // 30 minutes
            cacheEverything: true,
        },
    });

    const $ = load(await res.text(), { xml: { xmlMode: false } });

    const results: FuelStation[] = [];
    $("#placesContent")
        .find(`[itemtype="http://www.data-vocabulary.org/LocalBusiness"]`)
        .each((_, e) => {
            const addr = $(`[itemtype="http://data-vocabulary.org/PostalAddress"]`, e);

            const fuels: Fuel[] = [];
            $(".col-5 > .row .col", e).each((_, el) => {
                const date = $(el).attr("title");

                fuels.push({
                    name: $(el).children().first().text(),
                    price: $(el).children().last().text(),
                    lastUpdated: date ? /\d{2}.\d{2}\.\d{4}/g.exec(date)?.[0] || null : null,
                });
            });

            results.push({
                name: $(`[itemprop="name"]`, e).text(),
                street: $(`[itemprop="streetAddress"]`, addr).text(),
                city: $(`[itemprop="addressLocality"]`, addr).text(),
                postalCode: $(`[itemprop="postalCode"]`, addr).attr("content") || "",
                fuels: fuels,
            });

            return --needed > 0;
        });

    return results;
};
