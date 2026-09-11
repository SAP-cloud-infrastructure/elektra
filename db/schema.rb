# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_03_13_154111) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "domain_profiles", id: :serial, force: :cascade do |t|
    t.datetime "created_at", precision: nil, null: false
    t.string "domain_id"
    t.string "tou_version"
    t.datetime "updated_at", precision: nil, null: false
    t.integer "user_profile_id"
    t.index ["user_profile_id"], name: "index_domain_profiles_on_user_profile_id"
  end

  create_table "friendly_id_entries", id: :serial, force: :cascade do |t|
    t.string "class_name"
    t.datetime "created_at", precision: nil, null: false
    t.string "endpoint"
    t.string "key"
    t.string "name"
    t.string "scope"
    t.string "slug"
    t.datetime "updated_at", precision: nil, null: false
    t.index ["class_name", "key"], name: "index_friendly_id_entries_on_class_name_and_key"
    t.index ["class_name", "scope", "key"], name: "index_friendly_id_entries_on_class_name_and_scope_and_key"
    t.index ["class_name"], name: "index_friendly_id_entries_on_class_name"
    t.index ["key"], name: "index_friendly_id_entries_on_key"
    t.index ["scope"], name: "index_friendly_id_entries_on_scope"
    t.index ["slug"], name: "index_friendly_id_entries_on_slug"
  end

  create_table "inquiry_inquiries", id: :serial, force: :cascade do |t|
    t.string "aasm_state"
    t.string "approver_domain_id"
    t.json "callbacks"
    t.datetime "created_at", precision: nil, null: false
    t.text "description"
    t.string "domain_id"
    t.string "kind"
    t.json "payload"
    t.string "project_id"
    t.integer "requester_id"
    t.json "tags"
    t.datetime "updated_at", precision: nil, null: false
  end

  create_table "inquiry_inquiries_processors", id: false, force: :cascade do |t|
    t.integer "inquiry_id", null: false
    t.integer "processor_id", null: false
    t.index ["inquiry_id", "processor_id"], name: "index_inquiry_processor"
    t.index ["processor_id", "inquiry_id"], name: "index_processor_inquiry"
  end

  create_table "inquiry_process_steps", id: :serial, force: :cascade do |t|
    t.datetime "created_at", precision: nil, null: false
    t.text "description"
    t.string "event"
    t.string "from_state"
    t.integer "inquiry_id"
    t.integer "processor_id"
    t.string "to_state"
    t.datetime "updated_at", precision: nil, null: false
    t.index ["inquiry_id"], name: "index_inquiry_process_steps_on_inquiry_id"
  end

  create_table "inquiry_processors", id: :serial, force: :cascade do |t|
    t.datetime "created_at", precision: nil, null: false
    t.string "email"
    t.string "full_name"
    t.string "name"
    t.string "uid"
    t.datetime "updated_at", precision: nil, null: false
  end

  create_table "object_cache", id: :string, force: :cascade do |t|
    t.string "cached_object_type"
    t.datetime "created_at", precision: nil, null: false
    t.string "domain_id"
    t.string "name"
    t.json "payload"
    t.string "project_id"
    t.string "search_label"
    t.datetime "updated_at", precision: nil, null: false
    t.index ["cached_object_type"], name: "index_object_cache_on_cached_object_type"
    t.index ["id"], name: "index_object_cache_on_id"
    t.index ["name"], name: "index_object_cache_on_name"
    t.index ["project_id"], name: "index_object_cache_on_project_id"
    t.index ["search_label"], name: "index_object_cache_on_search_label"
  end

  create_table "project_profiles", id: :serial, force: :cascade do |t|
    t.datetime "created_at", precision: nil, null: false
    t.string "project_id"
    t.datetime "updated_at", precision: nil, null: false
    t.text "wizard_payload"
  end

  create_table "user_profiles", id: :serial, force: :cascade do |t|
    t.datetime "created_at", precision: nil, null: false
    t.string "email"
    t.string "full_name"
    t.string "name"
    t.string "uid"
    t.datetime "updated_at", precision: nil, null: false
    t.index ["name"], name: "index_user_profiles_on_name"
    t.index ["uid"], name: "index_user_profiles_on_uid"
  end

  add_foreign_key "domain_profiles", "user_profiles"
end
