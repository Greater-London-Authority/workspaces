The 3 services are all needed in order to 1) display, 2) allow edits, and 3) allow admin-only access to the appropriate records.  It's a compact system that ensures absolute security of the data in each use-case, without duplication. The map-service names could certainly do with improvement however, I remember distinctly disliking them at the time!

This will be explained fully in an email if you search for one of the map-service names -- though I seem to recall those names were altered at the last minute, so perhaps better to search on something like Workspaces Verified. I no longer have access to my GLA work email, so cannot find it for you. Anyhow, here's a fresh description of each for you:


`Workspaces_service_editable` :: This holds records of all new submissions, which have not yet been verified by an admin. (`Layer: gis.gisapdata.all_sites_2016_06_29_wgs (ID: 0)`)
`Workspaces_service_editable_edits` :: These are edits made to previously verified records. These also must be verified by an admin. (`Layer: gis.gisapdata.all_sites_2016_06_29_wgs (ID: 0)`)
`Workspaces_service_verified` :: These are all the verified records, which can be shown to the general public. (`Layer: gis.gisapdata.all_sites_2016_06_29_wgs (ID: 0)`)

The table you show above is not a complete picture of the security of the 3 services however. In order for the public to be able to have open access to secure (though not yet verified) data, they have access only to a subset of the fields. The key difference is the verified field, which only an admin can alter.

My recommendation would be to start off by simply duplicating all 3 map-services, before changing their names, and replacing the non-generic fields.
