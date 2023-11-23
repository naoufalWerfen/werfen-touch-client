const initialDBQuery = `
    create table content_types
    (
        id          TEXT,
        sorting_key TEXT not null,
        name        TEXT not null,
        color       TEXT not null,
        primary key (id),
        unique (id)
    );

    create table contents
    (
        id                INTEGER,
        uuid              TEXT    not null,
        name              TEXT    not null,
        sorting_name      TEXT    not null,
        classification    TEXT    not null,
        mimetype          TEXT,
        image             TEXT,
        route             BLOB    not null,
        date_created      DATE    not null,
        version           INTEGER not null,
        published         BOOL    not null,
        visible           BOOL    not null,
        sendable          BOOL    not null,
        deleted           BOOL    not null,
        sorting_number    INTEGER,
        tid               TEXT,
        parent_content_id TEXT,
        business_unit_id  TEXT,
        primary key (id autoincrement),
        unique (id),
        unique (uuid),
        foreign key (tid) references content_types on update restrict on delete restrict
    );
    create table landing
    (
        id          TEXT,
        name        TEXT    not null,
        image       BLOB,
        action      BLOB,
        sorting_key INTEGER not null,
        size        INTEGER not null,
        published   BOOL    not null,
        primary key (id),
        unique (id)
    );
    create table profiles
    (
        id                TEXT,
        name              TEXT not null,
        hash              TEXT not null,
        last_verification DATE not null,
        primary key (id),
        unique (id)
    );
    create table groups
    (
        id             TEXT,
        name           TEXT not null,
        sorting_name   TEXT not null,
        image          BLOB,
        date_created   DATE not null,
        published      BOOL not null,
        deleted        BOOL not null,
        sorting_number INTEGER,
        hash           TEXT not null,
        primary key (id),
        unique (id),
        unique (sorting_name)
    );
    create table categories
    (
        id             TEXT,
        name           TEXT not null,
        sorting_name   TEXT not null,
        image          BLOB not null,
        date_created   DATE not null,
        published      BOOL not null,
        gid            TEXT,
        sorting_number INTEGER,
        hash           TEXT not null,
        primary key (id),
        unique (id),
        foreign key (gid) references groups (id)
    );
    create table categories_contents
    (
        content_UUID TEXT not null,
        cat_Id       int  not null,
        constraint categories_contents_pk primary key (cat_Id, content_UUID),
        foreign key (cat_Id) references categories,
        constraint categories_contents_contents_uuid_fk foreign key (content_UUID) references contents (uuid)
    );
    create table profiles_contents
    (
        profile_Id   TEXT,
        content_UUID TEXT,
        primary key (profile_Id, content_UUID),
        foreign key (profile_Id) references profiles,
        foreign key (content_UUID) references contents (uuid)
    );
    create table profiles_landing
    (
        profile_Id TEXT,
        landing_id TEXT,
        primary key (profile_Id, landing_id),
        foreign key (profile_Id) references profiles,
        foreign key (landing_id) references landing
    );
    create table download_manager
    (
        id                  INTEGER,
        uuid                TEXT    not null,
        name                TEXT    not null,
        profile_id          INTEGER,
        group_id            INTEGER,
        category_id         INTEGER,
        file_uuid           TEXT,
        status              TEXT    not null,
        version             INTEGER not null,
        package             BLOB    not null,
        classification      TEXT    not null,
        notification_date   DATE    not null,
        package_date        DATE    not null,
        installation_date   DATE,
        uninstallation_date DATE,
        filename            TEXT,
        url                 TEXT,
        should_rename       BOOL,
        route               TEXT,
        primary key (id autoincrement)
    );
    create table emails_manager
    (
        id           INTEGER,
        uuid         TEXT    not null,
        clientEmails BLOB    not null,
        clientName   TEXT    not null,
        clientEntity TEXT    not null,
        attachments  BLOB,
        createdOn    INTEGER not null,
        sentOn       INTEGER,
        status       TEXT    not null,
        message      BLOB    not null,
        primary key (id autoincrement),
        unique (id),
        unique (uuid)
    );
    create table visits_manager
    (
        id           INTEGER,
        uuid         TEXT not null,
        clientEmails BLOB not null,
        clientName   TEXT not null,
        clientEntity TEXT not null,
        attachments  BLOB not null,
        createdOn    DATE not null,
        dueOn        DATE not null,
        updatedOn    DATE not null,
        status       TEXT not null,
        notes        TEXT,
        primary key (id autoincrement),
        unique (id),
        unique (uuid)
    );
    create table user_settings
    (
        key   TEXT not null,
        value TEXT,
        unique (key)
    );
    CREATE TABLE logs
    (
        id              text    NOT NULL UNIQUE,
        appVersion      text    NOT NULL,
        profileId       text    NOT NULL,
        userId          text    NOT NULL,
        contentId       text,
        contentName     text,
        contentType     text,
        category        text    NOT NULL,
        action          text    NOT NULL,
        value           text,
        dateTime        integer NOT NULL,
        message         text,
        severity        text,
        visitId         text,
        synced          integer,
        parentContentId TEXT,
        businessUnitId  TEXT,
        salesOrganizationId TEXT,
        CONSTRAINT log_pk PRIMARY KEY (id)
    );
    INSERT
        OR IGNORE
    INTO content_types (id, sorting_key, name, color)
    values ('brochure', 'br', 'Brochures', '#2A373B'),
           ('case_study', 'cs', 'Case Studies', '#94A6B0'),
           ('clinical_paper', 's', 'Clinical Papers', '#5D5F5E'),
           ('clinical-publication', 'cp', 'Clinical Publications', '#5D5F5E'),
           ('ordering', 'o', 'Ordering', '#94A6B0'),
           ('publication', 'p', 'Publications', '#5D5F5E'),
           ('sales-aid', 'sa', 'Sales Aid', '#2A373B'),
           ('spec', 'sp', 'Specs', '#94A6B0'),
           ('calculator', 'calc', 'Calculators', '#2A3538'),
           ('demo', 'd', 'Demo', '#2A3538'),
           ('presentation', 'pr', 'Presentations', '#2A3738'),
           ('story/brochure', 'sbr', 'Story/Brochure', '#5D5F5E'),
           ('main-presentation', 'mp', 'Main Presentations', '#2A3738'),
           ('vdemo', 'vd', 'vDemo', '#2A3538'),
           ('sell_sheets', 'sh', 'Sell Sheets', '#5D5F5E');
    INSERT
        OR IGNORE
    INTO "user_settings" ("key", "value")
    VALUES ('firstInstalling', 'true'),
           ('appLanguage', 'English'),
           ('contentLanguage', 'English'),
           ('userProfile', '0'),
           ('userEmail', 'some@mail.com'),
           ('sendCopyToUser', 'Yes'),
           ('appInstallMethod', 'Manually'),
           ('salesOrganizationId',''),
           ('token','')
`;

module.exports = { initialDBQuery }
