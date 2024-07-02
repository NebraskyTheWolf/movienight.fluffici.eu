export default class Event {
    id: number;
    event_id: string;
    name: string;
    descriptions: string;
    begin: Date;
    end: Date;
    status: string;
    type: string;
    min: { lat: number | null, lng: number | null };
    max: { lat: number, lng: number };
    city: string | null;
    link: string;
    created_at: Date;
    updated_at: Date;
    banner_id: string;
    interestedPeoples: number;
    thumbnailId: string;
    mapId: string | null;

    constructor(
        id: number,
        event_id: string,
        name: string,
        descriptions: string,
        begin: string,
        end: string,
        status: string,
        type: string,
        min: { lat: number | null, lng: number | null },
        max: { lat: number, lng: number },
        city: string | null,
        link: string,
        created_at: string,
        updated_at: string,
        banner_id: string,
        interestedPeoples: number,
        thumbnailId: string,
        mapId: string | null
    ) {
        this.id = id;
        this.event_id = event_id;
        this.name = name;
        this.descriptions = descriptions;
        this.begin = new Date(begin);
        this.end = new Date(end);
        this.status = status;
        this.type = type;
        this.min = min;
        this.max = max;
        this.city = city;
        this.link = link;
        this.created_at = new Date(created_at);
        this.updated_at = new Date(updated_at);
        this.banner_id = banner_id;
        this.interestedPeoples = interestedPeoples;
        this.thumbnailId = thumbnailId;
        this.mapId = mapId;
    }
}
