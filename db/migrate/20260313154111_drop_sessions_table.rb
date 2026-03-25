class DropSessionsTable < ActiveRecord::Migration[7.1]
  def change
    drop_table :sessions do |t|
      t.string :session_id, null: false
      t.text :data
      t.datetime :created_at, precision: nil
      t.datetime :updated_at, precision: nil

      t.index :session_id, unique: true
      t.index :updated_at
    end
  end
end
