-- create two databases with the same table, and a user with
-- read-only access to one and write-only access to the other.
-- data written to 'loopback_wo.data' gets copied to 'loopback_ro.data'

drop database if exists loopback_ro;
drop database if exists loopback_wo;

create user if not exists loopback@'%' identified by 'loopback';

create database loopback_ro;
grant select on loopback_ro.* to loopback@'%';

create database loopback_wo;
grant insert, update on loopback_wo.* to loopback@'%';

drop table if exists loopback_wo.data;
create table loopback_wo.data (
  id integer not null auto_increment primary key,
  text varchar(255) unique not null);

drop table if exists loopback_ro.data;
create table loopback_ro.data (
  id integer not null auto_increment primary key,
  text varchar(255) unique not null);

-- simple "replication"
delimiter //
create trigger loopback_wo.replicate_insert after insert on loopback_wo.data
  for each row begin
    insert into loopback_ro.data (id, text) values (new.id, new.text);
  end;//
create trigger loopback_wo.replicate_delete after delete on loopback_wo.data
  for each row begin
    delete from loopback_ro.data where id=old.id;
  end;//
create trigger loopback_wo.replicate_update after update on loopback_wo.data
  for each row begin
    update loopback_ro.data set id=new.id, text=new.text where id=old.id;
  end;//
delimiter ;

insert into loopback_wo.data (text) values
  ('apple'), ('banana'), ('cherry');

-- replace with same data + more to double-check unique constraint
-- the first three should be deleted so 'apple' has id=4
replace into loopback_wo.data (text) values
  ('apple'), ('banana'), ('cherry'),
  ('date'), ('elderberry'), ('fig'),
  ('grape'), ('honeydew'), ('imbe'), -- now you know.
  ('jackfruit'), ('kiwi'), ('lemon');

select * from loopback_ro.data;
